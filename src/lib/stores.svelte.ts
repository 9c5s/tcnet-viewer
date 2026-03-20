import type {
  LayerInfo,
  TimeInfo,
  MetricsInfo,
  MetadataInfo,
  CuePoint,
  WaveformBar,
  NodeInfo,
  PacketLogEntry,
} from "./types.js";

export type LayoutMode = "cards" | "detail" | "table";

class ViewerStore {
  node: NodeInfo | null = $state(null);
  connected = $state(false);
  layoutMode: LayoutMode = $state("detail");

  layers: LayerInfo[] = $state(
    Array.from({ length: 8 }, () => ({
      source: 0,
      status: "IDLE" as const,
      trackID: 0,
      name: "",
    })),
  );
  time: (TimeInfo | null)[] = $state(Array.from<TimeInfo | null>({ length: 8 }, () => null));
  metrics: (MetricsInfo | null)[] = $state(
    Array.from<MetricsInfo | null>({ length: 8 }, () => null),
  );
  metadata: (MetadataInfo | null)[] = $state(
    Array.from<MetadataInfo | null>({ length: 8 }, () => null),
  );
  cues: (CuePoint[] | null)[] = $state(Array.from<CuePoint[] | null>({ length: 8 }, () => null));
  waveformSmall: (WaveformBar[] | null)[] = $state(
    Array.from<WaveformBar[] | null>({ length: 8 }, () => null),
  );
  waveformBig: (WaveformBar[] | null)[] = $state(
    Array.from<WaveformBar[] | null>({ length: 8 }, () => null),
  );
  artwork: (string | null)[] = $state(Array.from<string | null>({ length: 8 }, () => null));
  mixer: Record<string, unknown> | null = $state(null);
  generalSMPTEMode = $state(0);

  selectedLayer = $state(0);

  packetLog: PacketLogEntry[] = $state([]);
  logFilters: Record<string, boolean> = $state({
    time: false,
    status: true,
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
    // ログエントリは最大500件に制限する
    if (this.packetLog.length > 500) {
      this.packetLog = this.packetLog.slice(-500);
    }
  }
}

export const store = new ViewerStore();
