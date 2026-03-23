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

// server/parsers/types.ts から共通型を再エクスポートする
export type {
  CuePoint,
  WaveformBar,
  MixerChannel,
  CueData,
  WaveformData,
  MixerData,
  BeatGridEntry,
} from "../../server/parsers/types.js";

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
import type { WSMessage } from "../../server/types.js";

// dataプロパティを持つWSMessageのユニオン型
type WSMessageWithData = Extract<WSMessage, { data: unknown }>;

// WSMessageからメッセージ型別のdata型を抽出するユーティリティ型 (dataプロパティを持つ型のみ対象)
type ExtractWSData<T extends WSMessageWithData["type"]> = Extract<
  WSMessageWithData,
  { type: T }
>["data"];

export type MetricsData = ExtractWSData<"metrics">;
export type MetadataData = ExtractWSData<"metadata">;

// レイヤーステータスに対応するTailwindクラスを返す
export function statusClass(status: LayerStatus): string {
  switch (status) {
    case "PLAYING":
    case "LOOPING":
      return "text-success";
    case "PAUSED":
      return "text-warning";
    case "STOPPED":
      return "text-error";
    default:
      return "text-base-content/40";
  }
}

// レイヤーステータスに対応するbadgeバリアントクラスを返す
export function statusBadgeClass(status: LayerStatus): string {
  switch (status) {
    case "PLAYING":
    case "LOOPING":
      return "badge-success";
    case "PAUSED":
      return "badge-warning";
    case "STOPPED":
      return "badge-error";
    default:
      return "";
  }
}
