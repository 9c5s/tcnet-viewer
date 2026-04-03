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
} from "./types.js";

export type LayoutMode = "cards" | "detail" | "table";

export type Theme = "tokyo-night" | "tokyo-night-storm" | "tokyo-night-light";

class ViewerStore {
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
    (() => {
      try {
        if (typeof localStorage === "undefined") return "detail" as const;
        const stored = localStorage.getItem("layoutMode");
        const valid: LayoutMode[] = ["cards", "detail", "table"];
        return valid.includes(stored as LayoutMode) ? (stored as LayoutMode) : ("detail" as const);
      } catch {
        return "detail" as const;
      }
    })(),
  );
  theme: Theme = $state(
    (() => {
      try {
        if (typeof localStorage === "undefined") return "tokyo-night" as const;
        const stored = localStorage.getItem("theme");
        const valid: Theme[] = ["tokyo-night", "tokyo-night-storm", "tokyo-night-light"];
        return valid.includes(stored as Theme) ? (stored as Theme) : ("tokyo-night" as const);
      } catch {
        return "tokyo-night" as const;
      }
    })(),
  );
  hideIdleLayers: boolean = $state(
    (() => {
      try {
        if (typeof localStorage === "undefined") return false;
        return localStorage.getItem("hideIdleLayers") === "true";
      } catch {
        return false;
      }
    })(),
  );
  packetLogHeight: number = $state(
    (() => {
      try {
        if (typeof localStorage === "undefined") return 200;
        const stored = localStorage.getItem("packetLogHeight");
        if (stored) {
          const parsed = Number(stored);
          if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
      } catch {
        // パースに失敗した場合はデフォルトを返す
      }
      return 200;
    })(),
  );

  layers: LayerInfo[] = $state(
    Array.from({ length: 8 }, () => ({
      source: 0,
      status: "IDLE" as const,
      trackID: 0,
      name: "",
    })),
  );
  time: (TimeInfo | null)[] = $state(Array.from({ length: 8 }, (): TimeInfo | null => null));
  metrics: (MetricsData | null)[] = $state(
    Array.from({ length: 8 }, (): MetricsData | null => null),
  );
  metadata: (MetadataData | null)[] = $state(
    Array.from({ length: 8 }, (): MetadataData | null => null),
  );
  cues: (CuePoint[] | null)[] = $state(Array.from({ length: 8 }, (): CuePoint[] | null => null));
  waveformSmall: (WaveformBar[] | null)[] = $state(
    Array.from({ length: 8 }, (): WaveformBar[] | null => null),
  );
  waveformBig: (WaveformBar[] | null)[] = $state(
    Array.from({ length: 8 }, (): WaveformBar[] | null => null),
  );
  artwork: ({ base64: string; mimeType: string } | null)[] = $state(
    Array.from({ length: 8 }, (): { base64: string; mimeType: string } | null => null),
  );
  beatgrid: (BeatGridEntry[] | null)[] = $state(
    Array.from({ length: 8 }, (): BeatGridEntry[] | null => null),
  );
  mixer: MixerData | null = $state(null);
  generalSMPTEMode = $state(0);

  resetLayerData(): void {
    for (let i = 0; i < 8; i++) {
      this.metadata[i] = null;
      this.artwork[i] = null;
      this.cues[i] = null;
      this.waveformSmall[i] = null;
      this.waveformBig[i] = null;
      this.beatgrid[i] = null;
    }
  }

  selectedLayer = $state(0);

  packetLog: PacketLogEntry[] = $state([]);
  private static readonly DEFAULT_LOG_FILTERS: Record<string, boolean> = {
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
    server: true,
    "tcnet-error": true,
    appdata: true,
  };

  logFilters: Record<string, boolean> = $state(
    (() => {
      try {
        if (typeof localStorage === "undefined") return { ...ViewerStore.DEFAULT_LOG_FILTERS };
        const stored = localStorage.getItem("logFilters");
        if (stored) {
          const parsed = JSON.parse(stored) as Record<string, boolean>;
          // デフォルトとマージし、新しいキーが追加されても対応する
          return { ...ViewerStore.DEFAULT_LOG_FILTERS, ...parsed };
        }
      } catch {
        // パースに失敗した場合はデフォルトを返す
      }
      return { ...ViewerStore.DEFAULT_LOG_FILTERS };
    })(),
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
