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
import { getLocalStorageValue } from "./storage.js";

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
    getLocalStorageValue<LayoutMode>("layoutMode", "detail", (raw) => {
      const valid: LayoutMode[] = ["cards", "detail", "table"];
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
