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
} from "./types.js";

export type LayoutMode = "cards" | "detail" | "table";

export type Theme = "tokyo-night" | "tokyo-night-storm" | "tokyo-night-light";

class ViewerStore {
  node: NodeInfo | null = $state(null);
  connected = $state(false);
  tcnetConnected = $state(false);

  get statusIndicator(): { color: string; text: string } {
    if (!this.connected) return { color: "bg-error", text: "Disconnected" };
    return this.tcnetConnected
      ? { color: "bg-success", text: "Connected" }
      : { color: "bg-warning", text: "Waiting for Bridge..." };
  }
  layoutMode: LayoutMode = $state("detail");
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
  packetLogHeight = $state(200);

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
  artwork: (string | null)[] = $state(Array.from({ length: 8 }, (): string | null => null));
  beatgrid: (BeatGridEntry[] | null)[] = $state(
    Array.from({ length: 8 }, (): BeatGridEntry[] | null => null),
  );
  mixer: MixerData | null = $state(null);
  generalSMPTEMode = $state(0);

  selectedLayer = $state(0);

  packetLog: PacketLogEntry[] = $state([]);
  logFilters: Record<string, boolean> = $state({
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
  });
  private logIdCounter = 0;

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
