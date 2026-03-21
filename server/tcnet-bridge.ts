// ViteのSSRモジュールランナーはESMコンテキストで実行するため、
// node-tcnetのバンドル成果物にあるdynamic requireが失敗する
// createRequireを使ってCJSとしてロードすることで回避する
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const tcnet = require("@9c5s/node-tcnet");
const {
  TCNetClient,
  TCNetConfiguration,
  TCNetStatusPacket,
  TCNetOptInPacket,
  TCNetOptOutPacket,
  TCNetTimePacket,
  TCNetDataPacket,
  TCNetDataPacketMetrics,
  TCNetDataPacketMetadata,
  TCNetDataPacketType,
} = tcnet;

import { parseBeatGrid } from "./parsers/beat-grid.js";
import { parseCueData } from "./parsers/cue-data.js";
import { parseSmallWaveform, parseBigWaveform } from "./parsers/waveform.js";
import { parseMixerData } from "./parsers/mixer.js";
import { MultiPacketAssembler } from "./parsers/multi-packet.js";
import type { BroadcastFn } from "./types.js";

export class TCNetBridge {
  private client: TCNetClient;
  private broadcast: BroadcastFn;
  private trackIds: (number | null)[] = Array.from({ length: 8 }, () => null);
  private beatGridAssembler = new MultiPacketAssembler();
  private bigWaveformAssembler = new MultiPacketAssembler();

  constructor(iface: string, broadcast: BroadcastFn) {
    this.broadcast = broadcast;
    const config = new TCNetConfiguration();
    config.broadcastInterface = iface;
    config.brodcastListeningAddress = "0.0.0.0";
    this.client = new TCNetClient(config);
  }

  async connect(): Promise<void> {
    await this.client.connect();
    this.setupListeners();
    console.log("[TCNet] 接続完了");
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
    console.log("[TCNet] 切断完了");
  }

  private setupListeners(): void {
    this.client.on("broadcast", (packet: unknown) => {
      if (packet instanceof TCNetOptInPacket) {
        this.broadcast({
          type: "optin",
          timestamp: Date.now(),
          data: {
            nodeCount: packet.nodeCount,
            nodeListenerPort: packet.nodeListenerPort,
            uptime: packet.uptime,
            vendorName: packet.vendorName,
            appName: packet.appName,
            majorVersion: packet.majorVersion,
            minorVersion: packet.minorVersion,
            bugVersion: packet.bugVersion,
            nodeName: packet.header.nodeName,
            nodeType: packet.header.nodeType,
            nodeId: packet.header.nodeId,
            protocolMinorVersion: packet.header.minorVersion,
          },
        });
        return;
      }
      if (packet instanceof TCNetOptOutPacket) {
        this.broadcast({
          type: "optout",
          timestamp: Date.now(),
          data: { nodeCount: packet.nodeCount },
        });
        return;
      }
      if (packet instanceof TCNetStatusPacket) {
        this.handleStatus(packet);
        return;
      }
    });

    this.client.on("time", (packet: unknown) => {
      if (packet instanceof TCNetTimePacket) {
        this.broadcast({
          type: "time",
          timestamp: Date.now(),
          data: {
            layers: packet.layers,
            generalSMPTEMode: packet.generalSMPTEMode,
          },
        });
      }
    });

    this.client.on("data", (packet: unknown) => {
      if (packet instanceof TCNetDataPacketMetrics) {
        this.broadcast({
          type: "metrics",
          timestamp: Date.now(),
          layer: packet.layer,
          data: packet.data ?? {},
        });
        return;
      }

      // TCNetDataPacket基底クラスで受信されるパケットをdataTypeで分岐処理する
      if (packet instanceof TCNetDataPacket) {
        const buf: Buffer = packet.buffer;
        const dataType: number = packet.dataType;
        const layer: number = packet.layer;

        try {
          switch (dataType) {
            case TCNetDataPacketType.CUEData: {
              const cue = parseCueData(buf);
              this.broadcast({
                type: "cue",
                timestamp: Date.now(),
                layer,
                data: cue,
              });
              break;
            }
            case TCNetDataPacketType.SmallWaveFormData: {
              const waveform = parseSmallWaveform(buf);
              this.broadcast({
                type: "waveform-small",
                timestamp: Date.now(),
                layer,
                data: waveform,
              });
              break;
            }
            case TCNetDataPacketType.BigWaveFormData: {
              if (this.bigWaveformAssembler.add(buf)) {
                const assembled = this.bigWaveformAssembler.assemble();
                const waveform = parseBigWaveform(assembled);
                this.broadcast({
                  type: "waveform-big",
                  timestamp: Date.now(),
                  layer,
                  data: waveform,
                });
                this.bigWaveformAssembler.reset();
              }
              break;
            }
            case TCNetDataPacketType.MixerData: {
              const mixer = parseMixerData(buf);
              this.broadcast({
                type: "mixer",
                timestamp: Date.now(),
                data: mixer,
              });
              break;
            }
            case TCNetDataPacketType.BeatGridData: {
              if (this.beatGridAssembler.add(buf)) {
                const assembled = this.beatGridAssembler.assemble();
                const beatgrid = parseBeatGrid(assembled);
                this.broadcast({
                  type: "beatgrid",
                  timestamp: Date.now(),
                  layer,
                  data: { entries: beatgrid },
                });
                this.beatGridAssembler.reset();
              }
              break;
            }
          }
        } catch (err) {
          console.error(`[TCNet] パーサーエラー (dataType=${dataType}):`, err);
        }
      }
    });
  }

  private handleStatus(packet: TCNetStatusPacket): void {
    this.broadcast({
      type: "status",
      timestamp: Date.now(),
      data: {
        ...packet.data,
        layers: packet.layers.filter((l): l is NonNullable<typeof l> => l != null),
      },
    });

    // trackIDが変化したレイヤーのメタデータをリクエストする
    for (let i = 0; i < packet.layers.length; i++) {
      const layer = packet.layers[i];
      if (layer && layer.trackID !== 0 && layer.trackID !== this.trackIds[i]) {
        console.log(`[TCNet] レイヤー${i}: トラックID ${this.trackIds[i]} -> ${layer.trackID}`);
        this.trackIds[i] = layer.trackID;
        this.requestLayerData(i);
      }
    }
  }

  private async requestLayerData(layer: number): Promise<void> {
    console.log(`[TCNet] レイヤー${layer}のデータを要求中`);

    // MetaData (500ms間隔で最大6回リトライ、Bridgeのメタデータ準備を待つ)
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        const packet = await this.client.requestData(TCNetDataPacketType.MetaData, layer);
        if (packet instanceof TCNetDataPacketMetadata && packet.info) {
          const info = packet.info;
          if (info.trackTitle || info.trackArtist) {
            console.log(
              `[TCNet] メタデータ取得 レイヤー${layer} (試行${attempt}): "${info.trackTitle}"`,
            );
            this.broadcast({
              type: "metadata",
              timestamp: Date.now(),
              layer,
              data: info,
            });
            break;
          }
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.debug(`[TCNet] メタデータ取得失敗 (レイヤー${layer}, 試行${attempt}/6): ${reason}`);
      }
      if (attempt < 6) await new Promise((r) => setTimeout(r, 500));
    }

    // CUEData
    try {
      await this.client.requestData(TCNetDataPacketType.CUEData, layer);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.debug(`[TCNet] CUEデータ取得失敗 (レイヤー${layer}): ${reason}`);
    }

    // SmallWaveFormData
    try {
      await this.client.requestData(TCNetDataPacketType.SmallWaveFormData, layer);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.debug(`[TCNet] 小波形データ取得失敗 (レイヤー${layer}): ${reason}`);
    }
  }
}
