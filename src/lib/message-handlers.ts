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
import { formatBPM } from "./formatting.js";

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
  beatgrid: (BeatGridEntry[] | null)[];
  mixer: MixerData | null;
  generalSMPTEMode: number;
  addLogEntry(type: string, layer: number | undefined, summary: string): void;
}

type HandlerMap = {
  [K in WSMessage["type"]]: (msg: Extract<WSMessage, { type: K }>) => void;
};

export type { HandlerMap };

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
      for (let i = 0; i < msg.data.layers.length; i++) {
        const l = msg.data.layers[i];
        store.layers[i] = {
          source: l.source,
          status: STATUS_MAP[l.status] ?? "IDLE",
          trackID: l.trackID,
          name: l.name,
        };
      }
      store.addLogEntry(msg.type, undefined, `nodes=${msg.data.nodeCount}`);
    },
    time: (msg) => {
      for (let i = 0; i < msg.data.layers.length; i++) {
        store.time[i] = msg.data.layers[i] as TimeInfo | null;
      }
      store.generalSMPTEMode = msg.data.generalSMPTEMode;
      store.addLogEntry(msg.type, undefined, `smpte=${msg.data.generalSMPTEMode}`);
    },
    metrics: (msg) => {
      store.metrics[msg.layer] = msg.data;
      store.addLogEntry(
        msg.type,
        msg.layer,
        `bpm=${msg.data.bpm != null ? formatBPM(msg.data.bpm) : "N/A"}`,
      );
    },
    metadata: (msg) => {
      store.metadata[msg.layer] = msg.data;
      store.addLogEntry(msg.type, msg.layer, `"${msg.data.trackTitle}"`);
    },
    cue: (msg) => {
      store.cues[msg.layer] = msg.data.cues;
      store.addLogEntry(msg.type, msg.layer, `${msg.data.cues?.length ?? 0} cues`);
    },
    "waveform-small": (msg) => {
      store.waveformSmall[msg.layer] = msg.data.bars;
      store.addLogEntry(msg.type, msg.layer, `${msg.data.bars?.length ?? 0} bars`);
    },
    "waveform-big": (msg) => {
      store.waveformBig[msg.layer] = msg.data.bars;
      store.addLogEntry(msg.type, msg.layer, `${msg.data.bars?.length ?? 0} bars`);
    },
    mixer: (msg) => {
      store.mixer = msg.data;
      store.addLogEntry(msg.type, undefined, `master=${msg.data.masterAudioLevel}`);
    },
    artwork: (msg) => {
      store.artwork[msg.layer] = { base64: msg.data.base64, mimeType: msg.data.mimeType };
      const sizeKB = Math.round((msg.data.base64.length * 3) / 4 / 1024);
      store.addLogEntry(msg.type, msg.layer, `${sizeKB}KB ${msg.data.mimeType}`);
    },
    "layer-reset": (msg) => {
      const i = msg.layer;
      // metadataはクリアしない (新データで上書きされるまで前曲を表示し、レイアウトの崩れを防ぐ)
      store.artwork[i] = null;
      store.cues[i] = null;
      store.waveformSmall[i] = null;
      store.waveformBig[i] = null;
      store.beatgrid[i] = null;
    },
    beatgrid: (msg) => {
      store.beatgrid[msg.layer] = msg.data.entries;
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
      store.addLogEntry("tcnet-error", undefined, `${msg.data.errorData.length} bytes`);
    },
    appdata: (msg) => {
      store.addLogEntry(
        "appdata",
        undefined,
        `cmd=${msg.data.cmd} token=0x${msg.data.token.toString(16).padStart(8, "0")} dest=0x${msg.data.dest.toString(16).padStart(4, "0")} port=${msg.data.listenerPort}`,
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
