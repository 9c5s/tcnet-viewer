import type {
  LayerInfo,
  TimeInfo,
  MetricsData,
  MetadataData,
  CuePoint,
  WaveformBar,
  MixerData,
  NodeInfo,
  PacketLogEntry,
  BeatGridEntry,
  AuthState,
  Arrangement,
} from "./types.js";
import { getLocalStorageValue } from "./storage.js";
import { ZOOM_DEFAULT, ZOOM_MAX, ZOOM_MIN } from "./player-status/waveform-canvas/draw-math.js";

/**
 * 配列の index 位置に値を入れた新しい配列を返す。
 * $state.raw なストア配列の要素更新に使う。
 */
export function replaceAt<T>(arr: readonly T[], index: number, value: T): T[] {
  const next = arr.slice();
  next[index] = value;
  return next;
}

export type LayoutMode = "cards" | "detail" | "table" | "player-status";

export type Theme = "tokyo-night" | "tokyo-night-storm" | "tokyo-night-light";

export class ViewerStore {
  node: NodeInfo | null = $state(null);
  connected = $state(false);
  tcnetConnected = $state(false);
  authState: AuthState = $state("none");

  get statusIndicator(): { color: string; text: string } {
    if (!this.connected) return { color: "bg-error", text: "Disconnected" };
    if (!this.tcnetConnected) return { color: "bg-warning", text: "Waiting for Bridge..." };
    switch (this.authState) {
      case "authenticated":
        return { color: "bg-success", text: "Authenticated" };
      case "failed":
        return { color: "bg-error", text: "Auth Failed" };
      case "pending":
        return { color: "bg-warning", text: "Authenticating..." };
      case "none":
        return { color: "bg-success", text: "Connected" };
    }
  }
  layoutMode: LayoutMode = $state(
    getLocalStorageValue<LayoutMode>("layoutMode", "detail", (raw) => {
      const valid: LayoutMode[] = ["cards", "detail", "table", "player-status"];
      return valid.includes(raw as LayoutMode) ? (raw as LayoutMode) : "detail";
    }),
  );
  theme: Theme = $state(
    getLocalStorageValue<Theme>("theme", "tokyo-night", (raw) => {
      const valid: Theme[] = ["tokyo-night", "tokyo-night-storm", "tokyo-night-light"];
      return valid.includes(raw as Theme) ? (raw as Theme) : "tokyo-night";
    }),
  );
  hideIdleLayers: boolean = $state(
    getLocalStorageValue<boolean>("hideIdleLayers", false, (raw) => raw === "true"),
  );
  packetLogHeight: number = $state(
    getLocalStorageValue<number>("packetLogHeight", 200, (raw) => {
      const parsed = Number(raw);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 200;
    }),
  );

  playerStatusArrange: Arrangement = $state(
    getLocalStorageValue<Arrangement>("playerStatusArrange", "stack", (raw) => {
      const valid: Arrangement[] = ["stack", "row", "grid"];
      return valid.includes(raw as Arrangement) ? (raw as Arrangement) : "stack";
    }),
  );

  // 要素書き換え時に新配列を代入する運用のため $state.raw を使う。
  // $state で deep proxy 化すると巨大な bars 配列 (40000+ 要素) や
  // レイヤ毎のメタデータが大量の proxy ラッパーを生み、トラック変更を
  // 繰り返すと proxy が GC されずメモリリークする問題があった (実測 800MB)
  playerStatusZoom: number[] = $state.raw(
    getLocalStorageValue<number[]>(
      "playerStatusZoom",
      [ZOOM_DEFAULT, ZOOM_DEFAULT, ZOOM_DEFAULT, ZOOM_DEFAULT],
      (raw) => {
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (
            Array.isArray(parsed) &&
            parsed.length === 4 &&
            parsed.every((v) => typeof v === "number")
          ) {
            return parsed.map((v) => Math.min(Math.max(Math.round(v), ZOOM_MIN), ZOOM_MAX));
          }
        } catch {
          // fallthrough
        }
        return [ZOOM_DEFAULT, ZOOM_DEFAULT, ZOOM_DEFAULT, ZOOM_DEFAULT];
      },
    ),
  );

  layers: LayerInfo[] = $state.raw(
    Array.from({ length: 8 }, () => ({
      source: 0,
      status: "IDLE" as const,
      trackID: 0,
      name: "",
    })),
  );
  time: (TimeInfo | null)[] = $state.raw(Array.from({ length: 8 }, (): TimeInfo | null => null));
  metrics: (MetricsData | null)[] = $state.raw(
    Array.from({ length: 8 }, (): MetricsData | null => null),
  );
  metadata: (MetadataData | null)[] = $state.raw(
    Array.from({ length: 8 }, (): MetadataData | null => null),
  );
  cues: (CuePoint[] | null)[] = $state.raw(
    Array.from({ length: 8 }, (): CuePoint[] | null => null),
  );
  waveformSmall: (WaveformBar[] | null)[] = $state.raw(
    Array.from({ length: 8 }, (): WaveformBar[] | null => null),
  );
  waveformBig: (WaveformBar[] | null)[] = $state.raw(
    Array.from({ length: 8 }, (): WaveformBar[] | null => null),
  );
  artwork: ({ base64: string; mimeType: string } | null)[] = $state.raw(
    Array.from({ length: 8 }, (): { base64: string; mimeType: string } | null => null),
  );
  artworkFailed: boolean[] = $state.raw(Array.from({ length: 8 }, () => false));
  beatgrid: (BeatGridEntry[] | null)[] = $state.raw(
    Array.from({ length: 8 }, (): BeatGridEntry[] | null => null),
  );
  mixer: MixerData | null = $state(null);
  generalSMPTEMode = $state(0);

  // WebSocket再接続時用の完全リセット (metadataも含めて全クリア)
  // layer-resetハンドラはトラック変更時にmetadataを保持してレイアウト崩れを防ぐが、
  // 再接続時はサーバーからキャッシュ済みデータが再送されるため全てクリアする
  resetLayerData(): void {
    this.metadata = Array.from({ length: 8 }, (): MetadataData | null => null);
    this.metrics = Array.from({ length: 8 }, (): MetricsData | null => null);
    this.time = Array.from({ length: 8 }, (): TimeInfo | null => null);
    this.artwork = Array.from(
      { length: 8 },
      (): { base64: string; mimeType: string } | null => null,
    );
    this.artworkFailed = Array.from({ length: 8 }, () => false);
    this.cues = Array.from({ length: 8 }, (): CuePoint[] | null => null);
    this.waveformSmall = Array.from({ length: 8 }, (): WaveformBar[] | null => null);
    this.waveformBig = Array.from({ length: 8 }, (): WaveformBar[] | null => null);
    this.beatgrid = Array.from({ length: 8 }, (): BeatGridEntry[] | null => null);
  }

  selectedLayer = $state(0);

  packetLog: PacketLogEntry[] = $state([]);
  static readonly DEFAULT_LOG_FILTERS: Record<string, boolean> = {
    time: false,
    status: false,
    metrics: true,
    metadata: true,
    optin: false,
    optout: true,
    cue: true,
    beatgrid: true,
    "waveform-small": true,
    "waveform-big": true,
    mixer: true,
    artwork: true,
    "artwork-failed": true,
    server: true,
    "tcnet-error": true,
    appdata: true,
  };

  logFilters: Record<string, boolean> = $state(
    getLocalStorageValue<Record<string, boolean>>(
      "logFilters",
      { ...ViewerStore.DEFAULT_LOG_FILTERS },
      (raw) => ({
        ...ViewerStore.DEFAULT_LOG_FILTERS,
        ...(JSON.parse(raw) as Record<string, boolean>),
      }),
    ),
  );
  private logIdCounter = 0;

  toggleHideIdleLayers(): void {
    this.hideIdleLayers = !this.hideIdleLayers;
    try {
      localStorage.setItem("hideIdleLayers", String(this.hideIdleLayers));
    } catch {
      // localStorage書き込みに失敗しても動作は継続する
    }
  }

  toggleLogFilter(key: string): void {
    this.logFilters[key] = !this.logFilters[key];
    try {
      localStorage.setItem("logFilters", JSON.stringify(this.logFilters));
    } catch {
      // localStorage書き込みに失敗しても動作は継続する
    }
  }

  addLogEntry(type: string, layer: number | undefined, summary: string): void {
    // フィルタで非表示にされたtypeはバッファにも追加しない。
    // timeのような高頻度イベント(50-60Hz)でバッファが埋まり他の重要なログ
    // (server, tcnet-error, auth関連等)がevictされるのを防ぐ。
    // トレードオフ: フィルタをON->OFF->ONと切り替えても過去のエントリは
    // 戻らない(filter OFF中は記録自体されないため)。必要な時だけONにして
    // ライブ観測する運用を想定している。
    if (this.logFilters[type] === false) return;
    this.packetLog.push({
      id: this.logIdCounter++,
      timestamp: Date.now(),
      type,
      layer,
      summary,
    });
    // ログエントリは最大5000件に制限する (インプレースで古いエントリを削除)
    const excess = this.packetLog.length - 5000;
    if (excess > 0) {
      this.packetLog.splice(0, excess);
    }
  }
}

export const store = new ViewerStore();
