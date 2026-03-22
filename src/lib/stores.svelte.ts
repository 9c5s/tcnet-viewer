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
} from "./types.js";

export type LayoutMode = "cards" | "detail" | "table";

export type Theme = "tokyo-night" | "tokyo-night-storm" | "tokyo-night-light";

class ViewerStore {
  node: NodeInfo | null = $state(null);
  connected = $state(false);
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
  time: (TimeInfo | null)[] = $state(new Array<TimeInfo | null>(8).fill(null));
  metrics: (MetricsData | null)[] = $state(new Array<MetricsData | null>(8).fill(null));
  metadata: (MetadataData | null)[] = $state(new Array<MetadataData | null>(8).fill(null));
  cues: (CuePoint[] | null)[] = $state(new Array<CuePoint[] | null>(8).fill(null));
  waveformSmall: (WaveformBar[] | null)[] = $state(new Array<WaveformBar[] | null>(8).fill(null));
  waveformBig: (WaveformBar[] | null)[] = $state(new Array<WaveformBar[] | null>(8).fill(null));
  artwork: (string | null)[] = $state(new Array<string | null>(8).fill(null));
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
