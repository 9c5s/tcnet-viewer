export type LayerStatus =
  | "IDLE"
  | "PLAYING"
  | "LOOPING"
  | "PAUSED"
  | "STOPPED"
  | "CUEDOWN"
  | "PLATTERDOWN"
  | "FFWD"
  | "FFRV"
  | "HOLD";

export type LayerInfo = {
  source: number;
  status: LayerStatus;
  trackID: number;
  name: string;
};

export type TimeInfo = {
  currentTimeMillis: number;
  totalTimeMillis: number;
  beatMarker: number;
  state: number;
  onAir: number;
};

export type MetricsInfo = {
  state: number;
  syncMaster: number;
  beatMarker: number;
  trackLength: number;
  currentPosition: number;
  speed: number;
  beatNumber: number;
  bpm: number;
  pitchBend: number;
  trackID: number;
};

export type MetadataInfo = {
  trackArtist: string;
  trackTitle: string;
  trackKey: number;
  trackID: number;
};

export type CuePoint = {
  index: number;
  type: number;
  inTime: number;
  outTime: number;
  color: { r: number; g: number; b: number };
};

export type WaveformBar = {
  level: number;
  color: number;
};

export type MixerChannel = {
  sourceSelect: number;
  audioLevel: number;
  faderLevel: number;
  trimLevel: number;
  compLevel: number;
  eqHi: number;
  eqHiMid: number;
  eqLowMid: number;
  eqLow: number;
  filterColor: number;
  send: number;
  cueA: number;
  cueB: number;
  crossfaderAssign: number;
};

export type NodeInfo = {
  nodeName: string;
  nodeType: number;
  nodeId: number;
  nodeCount: number;
  uptime: number;
  vendorName: string;
  appName: string;
  majorVersion: number;
  minorVersion: number;
  protocolVersion: string;
};

export type PacketLogEntry = {
  id: number;
  timestamp: number;
  type: string;
  layer?: number;
  summary: string;
};

export const LAYER_NAMES = ["L1", "L2", "L3", "L4", "LA", "LB", "LM", "LC"] as const;

export const STATUS_MAP: Record<number, LayerStatus> = {
  0: "IDLE",
  3: "PLAYING",
  4: "LOOPING",
  5: "PAUSED",
  6: "STOPPED",
  7: "CUEDOWN",
  8: "PLATTERDOWN",
  9: "FFWD",
  10: "FFRV",
  11: "HOLD",
};

// server/types.ts からWSMessage型を再エクスポートする
export type { WSMessage } from "../../server/types.js";
