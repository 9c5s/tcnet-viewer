import type { CueData, WaveformData, MixerData, BeatGridEntry } from "./parsers/types.js";

// --- メッセージ別data型 ---

type OptInData = {
  nodeCount: number;
  nodeListenerPort: number;
  uptime: number;
  vendorName: string;
  appName: string;
  majorVersion: number;
  minorVersion: number;
  bugVersion: number;
  nodeName: string;
  nodeType: number;
  nodeId: number;
  protocolMinorVersion: number;
};

type OptOutData = {
  nodeCount: number;
};

type StatusData = {
  nodeCount: number;
  layers: Array<{
    source: number;
    status: number;
    trackID: number;
    name: string;
  }>;
  [key: string]: unknown;
};

type TimeData = {
  layers: Array<Record<string, unknown>>;
  generalSMPTEMode: number;
};

// node-tcnetのTCNetDataPacketMetrics.dataがunknown型のため、フィールドはoptionalにする
type MetricsData = {
  state?: number;
  syncMaster?: number;
  beatMarker?: number;
  trackLength?: number;
  currentPosition?: number;
  speed?: number;
  beatNumber?: number;
  bpm?: number;
  pitchBend?: number;
  trackID?: number;
  [key: string]: unknown;
};

type MetadataData = {
  trackArtist: string;
  trackTitle: string;
  trackKey: number;
  trackID: number;
  [key: string]: unknown;
};

type ArtworkData = {
  base64: string;
};

type TCNetErrorData = {
  errorData: number[];
};

type AppDataData = {
  cmd: number;
  token: number;
  dest: number;
  listenerPort: number;
};

type BeatGridData = {
  entries: BeatGridEntry[];
};

export type WSMessage =
  | { type: "optin"; timestamp: number; data: OptInData }
  | { type: "optout"; timestamp: number; data: OptOutData }
  | { type: "status"; timestamp: number; data: StatusData }
  | { type: "time"; timestamp: number; data: TimeData }
  | { type: "mixer"; timestamp: number; data: MixerData }
  | { type: "metrics"; timestamp: number; layer: number; data: MetricsData }
  | { type: "metadata"; timestamp: number; layer: number; data: MetadataData }
  | { type: "cue"; timestamp: number; layer: number; data: CueData }
  | { type: "waveform-small"; timestamp: number; layer: number; data: WaveformData }
  | { type: "waveform-big"; timestamp: number; layer: number; data: WaveformData }
  | { type: "artwork"; timestamp: number; layer: number; data: ArtworkData }
  | { type: "beatgrid"; timestamp: number; layer: number; data: BeatGridData }
  | { type: "tcnet-error"; timestamp: number; data: TCNetErrorData }
  | { type: "appdata"; timestamp: number; data: AppDataData }
  | { type: "server-log"; timestamp: number; level: "log" | "warn" | "error"; message: string }
  | { type: "tcnet-status"; connected: boolean; authState: string; timestamp: number };

export type BroadcastFn = (msg: WSMessage) => void;
