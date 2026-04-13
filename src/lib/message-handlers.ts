import type {
  LayerInfo,
  TimeInfo,
  MetricsData,
  MetadataData,
  CuePoint,
  WaveformBar,
  MixerData,
  NodeInfo,
  BeatGridEntry,
  WSMessage,
  AuthState,
} from "./types.js";
import { STATUS_MAP } from "./types.js";
import { formatBPM, formatHex } from "./formatting.js";
import { replaceAt } from "./stores.svelte.js";

// ストアのinterface (テスト時にmockオブジェクトを注入可能にする)
export interface MessageHandlerStore {
  node: NodeInfo | null;
  tcnetConnected: boolean;
  authState: AuthState;
  layers: LayerInfo[];
  time: (TimeInfo | null)[];
  metrics: (MetricsData | null)[];
  metadata: (MetadataData | null)[];
  cues: (CuePoint[] | null)[];
  waveformSmall: (WaveformBar[] | null)[];
  waveformBig: (WaveformBar[] | null)[];
  artwork: ({ base64: string; mimeType: string } | null)[];
  artworkFailed: boolean[];
  beatgrid: (BeatGridEntry[] | null)[];
  mixer: MixerData | null;
  generalSMPTEMode: number;
  addLogEntry(type: string, layer: number | undefined, summary: string): void;
}

type HandlerMap = {
  [K in WSMessage["type"]]: (msg: Extract<WSMessage, { type: K }>) => void;
};

export type { HandlerMap };

/**
 * Bridge (BRIDGE64) が返す BigWaveForm は level のダイナミックレンジが狭い (max 48 程度) ため、
 * 受信時に bars 全体の最大 level で 0-255 に正規化して視認性を確保する。
 * maxLevel が 0 もしくは既に 255 の場合は変換せず元の参照を返す。
 */
function normalizeWaveformBars(bars: WaveformBar[]): WaveformBar[] {
  if (bars.length === 0) return bars;
  let maxLevel = 0;
  for (const b of bars) if (b.level > maxLevel) maxLevel = b.level;
  if (maxLevel === 0 || maxLevel >= 255) return bars;
  const scale = 255 / maxLevel;
  return bars.map((b) => ({
    color: b.color,
    level: Math.min(Math.round(b.level * scale), 255),
  }));
}

export function createHandlers(store: MessageHandlerStore): HandlerMap {
  return {
    optin: (msg) => {
      store.node = {
        nodeName: msg.data.nodeName,
        nodeType: msg.data.nodeType,
        nodeId: msg.data.nodeId,
        nodeCount: msg.data.nodeCount,
        uptime: msg.data.uptime,
        vendorName: msg.data.vendorName,
        appName: msg.data.appName,
        majorVersion: msg.data.majorVersion,
        minorVersion: msg.data.minorVersion,
        protocolVersion: `3.${msg.data.protocolMinorVersion}`,
      };
      store.addLogEntry(msg.type, undefined, `${msg.data.nodeName} nodes=${msg.data.nodeCount}`);
    },
    optout: (msg) => {
      store.addLogEntry(msg.type, undefined, `node left`);
    },
    status: (msg) => {
      // 配列は $state.raw なので要素代入ではなく新配列を一括で代入する
      const next = store.layers.slice();
      for (let i = 0; i < msg.data.layers.length; i++) {
        const l = msg.data.layers[i];
        next[i] = {
          source: l.source,
          status: STATUS_MAP[l.status] ?? "IDLE",
          trackID: l.trackID,
          name: l.name,
        };
      }
      store.layers = next;
      // APP SPECIFIC が取得できた場合のみ末尾に追記する (ログの肥大化を避けるため先頭32文字で切り詰める)
      const app = msg.data.appSpecific;
      const appSuffix = app ? ` app="${app.length > 32 ? `${app.slice(0, 32)}…` : app}"` : "";
      store.addLogEntry(msg.type, undefined, `nodes=${msg.data.nodeCount}${appSuffix}`);
    },
    time: (msg) => {
      const next = store.time.slice();
      for (let i = 0; i < msg.data.layers.length; i++) {
        next[i] = msg.data.layers[i] as TimeInfo | null;
      }
      store.time = next;
      store.generalSMPTEMode = msg.data.generalSMPTEMode;
      store.addLogEntry(msg.type, undefined, `smpte=${msg.data.generalSMPTEMode}`);
    },
    metrics: (msg) => {
      store.metrics = replaceAt(store.metrics, msg.layer, msg.data);
      store.addLogEntry(
        msg.type,
        msg.layer,
        `bpm=${msg.data.bpm != null ? formatBPM(msg.data.bpm) : "N/A"}`,
      );
    },
    metadata: (msg) => {
      store.metadata = replaceAt(store.metadata, msg.layer, msg.data);
      store.addLogEntry(msg.type, msg.layer, `"${msg.data.trackTitle}"`);
    },
    cue: (msg) => {
      store.cues = replaceAt(store.cues, msg.layer, msg.data.cues);
      store.addLogEntry(msg.type, msg.layer, `${msg.data.cues?.length ?? 0} cues`);
    },
    "waveform-small": (msg) => {
      store.waveformSmall = replaceAt(store.waveformSmall, msg.layer, msg.data.bars);
      store.addLogEntry(msg.type, msg.layer, `${msg.data.bars?.length ?? 0} bars`);
    },
    "waveform-big": (msg) => {
      store.waveformBig = replaceAt(
        store.waveformBig,
        msg.layer,
        normalizeWaveformBars(msg.data.bars),
      );
      store.addLogEntry(msg.type, msg.layer, `${msg.data.bars?.length ?? 0} bars`);
    },
    mixer: (msg) => {
      store.mixer = msg.data;
      store.addLogEntry(msg.type, undefined, `master=${msg.data.masterAudioLevel}`);
    },
    artwork: (msg) => {
      store.artwork = replaceAt(store.artwork, msg.layer, {
        base64: msg.data.base64,
        mimeType: msg.data.mimeType,
      });
      store.artworkFailed = replaceAt(store.artworkFailed, msg.layer, false);
      const sizeKB = Math.round((msg.data.base64.length * 3) / 4 / 1024);
      store.addLogEntry(msg.type, msg.layer, `${sizeKB}KB ${msg.data.mimeType}`);
    },
    "artwork-failed": (msg) => {
      store.artworkFailed = replaceAt(store.artworkFailed, msg.layer, true);
      store.artwork = replaceAt(store.artwork, msg.layer, null);
      store.addLogEntry(msg.type, msg.layer, "artwork fetch failed");
    },
    "layer-reset": (msg) => {
      const i = msg.layer;
      // metadataは保持 (trackIDで整合性チェックしてUI側でフィルタ)
      store.metrics = replaceAt(store.metrics, i, null);
      store.time = replaceAt(store.time, i, null);
      store.artwork = replaceAt(store.artwork, i, null);
      store.artworkFailed = replaceAt(store.artworkFailed, i, false);
      store.cues = replaceAt(store.cues, i, null);
      store.waveformSmall = replaceAt(store.waveformSmall, i, null);
      store.waveformBig = replaceAt(store.waveformBig, i, null);
      store.beatgrid = replaceAt(store.beatgrid, i, null);
      store.addLogEntry(msg.type, i, "layer data cleared");
    },
    beatgrid: (msg) => {
      store.beatgrid = replaceAt(store.beatgrid, msg.layer, msg.data.entries);
      store.addLogEntry(msg.type, msg.layer, `${msg.data.entries?.length ?? 0} beats`);
    },
    "tcnet-status": (msg) => {
      store.tcnetConnected = msg.connected;
      store.authState = msg.authState;
      store.addLogEntry(
        msg.type,
        undefined,
        msg.connected ? "Bridge connected" : "Bridge disconnected",
      );
    },
    "tcnet-error": (msg) => {
      const { dataType, layerId, code, messageType } = msg.data;
      store.addLogEntry(
        "tcnet-error",
        undefined,
        `code=${code} layer=${layerId} dataType=0x${formatHex(dataType, 2)} messageType=0x${formatHex(messageType, 4)}`,
      );
    },
    appdata: (msg) => {
      store.addLogEntry(
        "appdata",
        undefined,
        `cmd=${msg.data.cmd} token=0x${formatHex(msg.data.token, 8)} dest=0x${formatHex(msg.data.dest, 4)} port=${msg.data.listenerPort}`,
      );
    },
    "server-log": (msg) => {
      store.addLogEntry("server", undefined, `[${msg.level.toUpperCase()}] ${msg.message}`);
    },
  };
}

export function dispatchMessage<T extends WSMessage>(msg: T, handlers: HandlerMap): void {
  const handler = handlers[msg.type] as ((msg: T) => void) | undefined;
  if (handler) {
    handler(msg);
  } else {
    console.warn("[WS] 未処理のメッセージ型:", msg);
  }
}
