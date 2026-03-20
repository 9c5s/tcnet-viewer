// レイヤー情報を持たないメッセージ型
type WSMessageWithoutLayer = {
  type: "optin" | "optout" | "status" | "time" | "mixer";
  timestamp: number;
  data: Record<string, unknown>;
};

// レイヤー情報を持つメッセージ型
type WSMessageWithLayer = {
  type: "metrics" | "metadata" | "cue" | "waveform-small" | "waveform-big" | "artwork" | "beatgrid";
  timestamp: number;
  layer: number;
  data: Record<string, unknown>;
};

// typeフィールドでレイヤーの有無を判別するDiscriminated Union
export type WSMessage = WSMessageWithoutLayer | WSMessageWithLayer;

export type BroadcastFn = (msg: WSMessage) => void;
