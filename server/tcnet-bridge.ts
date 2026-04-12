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
  TCNetErrorPacket,
  TCNetApplicationDataPacket,
} = tcnet;

// createRequireでロードしたクラスは値のみ存在し型情報がないため、
// 型注釈用にimport typeで型を別途取得する
import type {
  TCNetClient as TCNetClientType,
  TCNetStatusPacket as TCNetStatusPacketType,
  TCNetOptInPacket as TCNetOptInPacketType,
  TCNetOptOutPacket as TCNetOptOutPacketType,
  TCNetTimePacket as TCNetTimePacketType,
  TCNetDataPacket as TCNetDataPacketType_,
  TCNetDataPacketMetrics as TCNetDataPacketMetricsType,
  TCNetDataPacketMetadata as TCNetDataPacketMetadataType,
  TCNetDataPacketArtwork as TCNetDataPacketArtworkType,
  TCNetDataPacketSmallWaveForm as TCNetDataPacketSmallWaveFormType,
  TCNetErrorPacket as TCNetErrorPacketType,
  TCNetApplicationDataPacket as TCNetApplicationDataPacketType,
} from "@9c5s/node-tcnet";

import { processArtworkPacket } from "./parsers/artwork.js";
import { parseBeatGrid } from "./parsers/beat-grid.js";
import { parseCueData } from "./parsers/cue-data.js";
import { parseBigWaveform } from "./parsers/waveform.js";
import { parseMixerData } from "./parsers/mixer.js";
import { MultiPacketAssembler } from "./parsers/multi-packet.js";
import type { BroadcastFn, AuthState } from "./types.js";

type TCNetBridgeOptions = {
  broadcast: BroadcastFn;
  onStatusChange: (connected: boolean, authState: AuthState) => void;
};

export class TCNetBridge {
  private client!: TCNetClientType;
  private broadcast: BroadcastFn;
  private onStatusChange: (connected: boolean, authState: AuthState) => void;
  private nodeName!: string;
  private running = false;
  private isReconnecting = false;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private trackIds: (number | null)[] = Array.from({ length: 8 }, () => null);
  // requestLayerDataの世代管理 (トラック変更時にインクリメントし、古いリクエストの結果を破棄する)
  private layerGeneration: number[] = Array.from({ length: 8 }, () => 0);
  private authState: AuthState = "none";
  // 認証失敗時の自動再試行カウンタ (authenticated/reconnect成功時にリセット)
  private authRetryCount = 0;
  private authRetryTimer: ReturnType<typeof setTimeout> | null = null;
  private beatGridAssemblers = new Map<number, MultiPacketAssembler>();
  private bigWaveformAssemblers = new Map<number, MultiPacketAssembler>();

  private static readonly HEARTBEAT_TIMEOUT = 10_000;
  private static readonly INITIAL_RETRY_DELAY = 2_000;
  private static readonly MAX_RETRY_DELAY = 30_000;
  // 認証失敗時の最大リトライ回数 (設定ミス時の無限ループを防ぐ)
  private static readonly MAX_AUTH_RETRIES = 3;

  constructor(options: TCNetBridgeOptions) {
    this.broadcast = options.broadcast;
    this.onStatusChange = options.onStatusChange;
    this.createClient();
  }

  private createClient(): void {
    const config = new TCNetConfiguration();
    // Bridgeの固定サイズFileパケット送信間隔にばらつきがあるため、
    // デフォルト200msでは最後のチャンクを取りこぼすことがある
    config.fileCollectionTimeout = 500;
    // 認証挙動追跡用にnode-tcnet内部のdebug/errorログを出力する
    // 認証トークン受信、OS判定、認証成功/失敗タイムアウト等のイベントを拾える
    config.logger = {
      debug: (message: string) => console.log(`[TCNet][DEBUG] ${message}`),
      warn: (message: string) => console.warn(`[TCNet][WARN] ${message}`),
      error: (error: Error) => console.error(`[TCNet][ERROR] ${error.message}`),
    };
    this.nodeName = config.nodeName;
    this.client = new TCNetClient(config);
    this.setupListeners();
  }

  async connect(): Promise<void> {
    this.running = true;
    let delay = TCNetBridge.INITIAL_RETRY_DELAY;

    while (this.running) {
      try {
        await this.client.connect();
        console.log("[TCNet] ソケット作成完了、アダプタ検出中...");
        return;
      } catch (err) {
        if (!this.running) return;
        const reason = err instanceof Error ? err.message : String(err);
        console.warn(`[TCNet] 接続失敗 (${reason}), ${delay / 1000}秒後にリトライ`);
        this.setAuthState("none", false);
        await this.sleep(delay);
        delay = Math.min(delay * 2, TCNetBridge.MAX_RETRY_DELAY);
        // 接続失敗したクライアントを破棄し、新インスタンスで再試行
        this.createClient();
      }
    }
  }

  async disconnect(): Promise<void> {
    this.running = false;
    this.stopHeartbeat();
    this.clearAuthRetry();
    await this.client.disconnect();
    console.log("[TCNet] 切断完了");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private resetLayerAssemblers(layer: number): void {
    this.beatGridAssemblers.get(layer)?.reset();
    this.bigWaveformAssemblers.get(layer)?.reset();
  }

  private getAssembler(
    map: Map<number, MultiPacketAssembler>,
    layer: number,
  ): MultiPacketAssembler {
    let asm = map.get(layer);
    if (!asm) {
      asm = new MultiPacketAssembler();
      map.set(layer, asm);
    }
    return asm;
  }

  private setAuthState(state: AuthState, connected: boolean): void {
    this.authState = state;
    this.onStatusChange(connected, state);
  }

  private clearAuthRetry(): void {
    if (this.authRetryTimer) {
      clearTimeout(this.authRetryTimer);
      this.authRetryTimer = null;
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private resetHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setTimeout(() => {
      console.warn("[TCNet] ハートビートタイムアウト: パケット未受信");
      this.reconnect().catch((err) => {
        console.error("[TCNet] 再接続処理でエラー:", err);
      });
    }, TCNetBridge.HEARTBEAT_TIMEOUT);
  }

  private async reconnect(): Promise<void> {
    if (this.isReconnecting || !this.running) return;
    this.isReconnecting = true;
    try {
      this.stopHeartbeat();
      this.clearAuthRetry();
      this.setAuthState("none", false);
      try {
        await this.client.disconnect();
      } catch {
        // 切断時のエラーは無視する
      }
      if (!this.running) return;
      this.beatGridAssemblers.clear();
      this.bigWaveformAssemblers.clear();
      this.trackIds = Array.from({ length: 8 }, () => null);
      // 旧セッションのrequestLayerDataを無効化する (世代を進めることでawait中のリクエストが破棄される)
      for (let i = 0; i < this.layerGeneration.length; i++) this.layerGeneration[i]++;
      // authRetryCountはここでリセットしない
      // authFailed→reconnect→authFailedのサイクルでMAX_AUTH_RETRIESに到達させるため
      // カウンタはauthenticatedイベント成功時のみリセットする
      this.createClient();
      await this.connect();
    } finally {
      this.isReconnecting = false;
    }
  }

  private setupListeners(): void {
    this.client.on("adapterSelected", () => {
      const name = this.client.selectedAdapter?.name ?? "unknown";
      console.log(`[TCNet] アダプタ確定: ${name}`);
      this.onStatusChange(true, this.authState);
      this.resetHeartbeat();
    });

    this.client.on("detectionTimeout", () => {
      console.warn("[TCNet] アダプタ検出タイムアウト (listenは継続)");
    });

    this.client.on("authenticated", () => {
      console.log("[TCNet] TCNASDP認証成功");
      this.authRetryCount = 0;
      this.clearAuthRetry();
      this.setAuthState("authenticated", true);
      // 認証完了後、認証前に要求していたレイヤーデータを再要求する
      for (let i = 0; i < this.trackIds.length; i++) {
        if (this.trackIds[i] !== null) {
          const gen = ++this.layerGeneration[i];
          this.requestLayerData(i, gen);
        }
      }
    });

    this.client.on("authFailed", () => {
      if (!this.running) return;
      if (this.authRetryCount < TCNetBridge.MAX_AUTH_RETRIES) {
        this.authRetryCount++;
        // 指数バックオフ: 2秒 -> 4秒 -> 8秒 (タイミング問題による一時的失敗を自動回復する)
        const delay = Math.min(
          TCNetBridge.INITIAL_RETRY_DELAY * 2 ** (this.authRetryCount - 1),
          TCNetBridge.MAX_RETRY_DELAY,
        );
        console.warn(
          `[TCNet] TCNASDP認証失敗 (${this.authRetryCount}/${TCNetBridge.MAX_AUTH_RETRIES}), ${delay / 1000}秒後に再接続`,
        );
        this.setAuthState("pending", true);
        this.clearAuthRetry();
        this.authRetryTimer = setTimeout(() => {
          this.authRetryTimer = null;
          this.reconnect().catch((err) => {
            console.error("[TCNet] 認証リトライ再接続エラー:", err);
          });
        }, delay);
      } else {
        // 上限到達 (設定ミスの可能性が高い) - 手動再接続を待つ
        console.warn("[TCNet] TCNASDP認証失敗、リトライ上限到達");
        this.setAuthState("failed", true);
      }
    });

    this.client.on("broadcast", (packet: unknown) => {
      if (packet instanceof TCNetOptInPacket) {
        const p = packet as TCNetOptInPacketType;
        // 自ノードのOptInはスキップする (node-tcnetが定期送信する自身のOptInを
        // 受信するため、ハートビートリセットも行わない)
        if (p.header.nodeName === this.nodeName) return;
        this.resetHeartbeat();
        this.broadcast({
          type: "optin",
          timestamp: Date.now(),
          data: {
            nodeCount: p.nodeCount,
            nodeListenerPort: p.nodeListenerPort,
            uptime: p.uptime,
            vendorName: p.vendorName,
            appName: p.appName,
            majorVersion: p.majorVersion,
            minorVersion: p.minorVersion,
            bugVersion: p.bugVersion,
            nodeName: p.header.nodeName,
            nodeType: p.header.nodeType,
            nodeId: p.header.nodeId,
            protocolMinorVersion: p.header.minorVersion,
          },
        });
        return;
      }
      this.resetHeartbeat();
      if (packet instanceof TCNetOptOutPacket) {
        const p = packet as TCNetOptOutPacketType;
        this.broadcast({
          type: "optout",
          timestamp: Date.now(),
          data: { nodeCount: p.nodeCount },
        });
        return;
      }
      if (packet instanceof TCNetStatusPacket) {
        this.handleStatus(packet as TCNetStatusPacketType);
        return;
      }
      if (packet instanceof TCNetErrorPacket) {
        const p = packet as TCNetErrorPacketType;
        this.broadcast({
          type: "tcnet-error",
          timestamp: Date.now(),
          data: {
            dataType: p.dataType,
            layerId: p.layerId,
            code: p.code,
            messageType: p.messageType,
          },
        });
        return;
      }
      if (packet instanceof TCNetApplicationDataPacket) {
        const p = packet as TCNetApplicationDataPacketType;
        this.broadcast({
          type: "appdata",
          timestamp: Date.now(),
          data: {
            cmd: p.cmd,
            token: p.token,
            dest: p.dest,
            listenerPort: p.listenerPort,
          },
        });
        return;
      }
    });

    this.client.on("time", (packet: unknown) => {
      this.resetHeartbeat();
      if (packet instanceof TCNetTimePacket) {
        const p = packet as TCNetTimePacketType;
        this.broadcast({
          type: "time",
          timestamp: Date.now(),
          data: {
            layers: p.layers,
            generalSMPTEMode: p.generalSMPTEMode,
          },
        });
      }
    });

    this.client.on("data", (packet: unknown) => {
      this.resetHeartbeat();
      if (packet instanceof TCNetDataPacketMetrics) {
        const p = packet as TCNetDataPacketMetricsType;
        this.broadcast({
          type: "metrics",
          timestamp: Date.now(),
          layer: p.layer,
          data: p.data ?? {},
        });
        return;
      }

      // TCNetDataPacket基底クラスで受信されるパケットをdataTypeで分岐処理する
      if (packet instanceof TCNetDataPacket) {
        const p = packet as TCNetDataPacketType_;
        const buf: Buffer = p.buffer;
        const dataType: number = p.dataType;
        const layer: number = p.layer;
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
              // node-tcnet側のTCNetDataPacketSmallWaveForm.dataにパース済みのwaveformを使う
              const smallWf = p as TCNetDataPacketSmallWaveFormType;
              if (smallWf.data) {
                this.broadcast({
                  type: "waveform-small",
                  timestamp: Date.now(),
                  layer,
                  data: smallWf.data,
                });
              }
              break;
            }
            case TCNetDataPacketType.BigWaveFormData: {
              const asm = this.getAssembler(this.bigWaveformAssemblers, layer);
              if (asm.add(buf)) {
                const assembled = asm.assemble();
                const waveform = parseBigWaveform(assembled);
                this.broadcast({
                  type: "waveform-big",
                  timestamp: Date.now(),
                  layer,
                  data: waveform,
                });
                asm.reset();
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
              const asm = this.getAssembler(this.beatGridAssemblers, layer);
              if (asm.add(buf)) {
                const assembled = asm.assemble();
                const beatgrid = parseBeatGrid(assembled);
                this.broadcast({
                  type: "beatgrid",
                  timestamp: Date.now(),
                  layer,
                  data: { entries: beatgrid },
                });
                asm.reset();
              }
              break;
            }
            // ArtworkDataはrequestLayerDataで直接処理する
            // (dataイベントで処理するとtimeout後の未アセンブル断片パケットを誤処理するため)
          }
        } catch (err) {
          console.error(`[TCNet] パーサーエラー (dataType=${dataType}):`, err);
        }
      }
    });
  }

  private handleStatus(packet: TCNetStatusPacketType): void {
    const statusData = packet.data ?? {
      nodeCount: 0,
      nodeListenerPort: 0,
      smpteMode: 0,
      autoMasterMode: 0,
    };
    this.broadcast({
      type: "status",
      timestamp: Date.now(),
      data: {
        ...statusData,
        layers: packet.layers.filter(
          (l: (typeof packet.layers)[number]): l is NonNullable<typeof l> => l != null,
        ),
      },
    });

    // trackIDが変化したレイヤーのデータをリセットしてリクエストする
    for (let i = 0; i < packet.layers.length; i++) {
      const layer = packet.layers[i];
      const nextTrackId = layer?.trackID ?? 0;

      // トラック取り出し (trackID → 0): 旧データをクリアするがリクエストは行わない
      if (nextTrackId === 0) {
        if (this.trackIds[i] !== null) {
          console.log(`[TCNet] レイヤー${i}: トラックID ${this.trackIds[i]} -> 取り出し`);
          this.trackIds[i] = null;
          this.broadcast({ type: "layer-reset", timestamp: Date.now(), layer: i });
          this.resetLayerAssemblers(i);
          this.layerGeneration[i]++;
        }
        continue;
      }

      // トラック変更 (非ゼロの新ID): データをリセットして新データをリクエストする
      if (nextTrackId !== this.trackIds[i]) {
        console.log(`[TCNet] レイヤー${i}: トラックID ${this.trackIds[i]} -> ${nextTrackId}`);
        this.trackIds[i] = nextTrackId;
        this.broadcast({ type: "layer-reset", timestamp: Date.now(), layer: i });
        this.resetLayerAssemblers(i);
        const gen = ++this.layerGeneration[i];
        this.requestLayerData(i, gen);
      }
    }
  }

  private async requestLayerData(layer: number, generation: number): Promise<void> {
    console.log(`[TCNet] レイヤー${layer}のデータを要求中`);

    // MetaData (500ms間隔で最大6回リトライ、Bridgeのメタデータ準備を待つ)
    for (let attempt = 1; attempt <= 6; attempt++) {
      // 世代が変わった場合、新しいトラックのリクエストが発行済みなので中断する
      if (this.layerGeneration[layer] !== generation) return;
      try {
        const packet = await this.client.requestData(TCNetDataPacketType.MetaData, layer);
        if (this.layerGeneration[layer] !== generation) return;
        if (packet instanceof TCNetDataPacketMetadata) {
          const p = packet as TCNetDataPacketMetadataType;
          if (p.info) {
            const info = p.info;
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
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.log(`[TCNet] メタデータ取得失敗 (レイヤー${layer}, 試行${attempt}/6): ${reason}`);
      }
      if (attempt < 6) await new Promise((r) => setTimeout(r, 500));
    }

    if (this.layerGeneration[layer] !== generation) return;

    // CUE, SmallWaveFormはfire-and-forget (単一パケットのため失敗しにくい)
    this.client.requestData(TCNetDataPacketType.CUEData, layer).catch(() => {});
    this.client.requestData(TCNetDataPacketType.SmallWaveFormData, layer).catch(() => {});

    // Artwork (マルチパケットのためパケットロス/タイムアウトが起きやすい、リトライする)
    // dataイベントではなくrequestDataの戻り値から直接処理する
    // (timeout後に届く未アセンブルの断片パケットを誤処理しないため)
    let artworkSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (this.layerGeneration[layer] !== generation) return;
      try {
        const packet = await this.client.requestData(TCNetDataPacketType.ArtworkData, layer);
        if (this.layerGeneration[layer] !== generation) return;
        const artPacket = packet as unknown as TCNetDataPacketArtworkType;
        const artworkData = processArtworkPacket(artPacket.data?.jpeg);
        if (artworkData) {
          this.broadcast({
            type: "artwork",
            timestamp: Date.now(),
            layer,
            data: artworkData,
          });
          artworkSuccess = true;
          break;
        }
        // 不完全なJPEG (EOIマーカーなし) の場合は再送要求する
        console.log(
          `[TCNet] アートワーク不正データ (レイヤー${layer}, 試行${attempt}/3, ${artPacket.data?.jpeg?.length ?? 0}B)`,
        );
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.log(`[TCNet] アートワーク取得失敗 (レイヤー${layer}, 試行${attempt}/3): ${reason}`);
      }
      if (attempt < 3) await this.sleep(500);
    }
    if (!artworkSuccess && this.layerGeneration[layer] === generation) {
      this.broadcast({
        type: "artwork-failed",
        timestamp: Date.now(),
        layer,
      });
    }
  }
}
