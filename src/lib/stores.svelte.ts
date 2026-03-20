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

  layers: LayerInfo[] = $state(new Array(8).fill(null).map(() => ({
    source: 0, status: "IDLE" as const, trackID: 0, name: "",
  })));
  time: (TimeInfo | null)[] = $state(new Array(8).fill(null));
  metrics: (MetricsInfo | null)[] = $state(new Array(8).fill(null));
  metadata: (MetadataInfo | null)[] = $state(new Array(8).fill(null));
  cues: (CuePoint[] | null)[] = $state(new Array(8).fill(null));
  waveformSmall: (WaveformBar[] | null)[] = $state(new Array(8).fill(null));
  waveformBig: (WaveformBar[] | null)[] = $state(new Array(8).fill(null));
  artwork: (string | null)[] = $state(new Array(8).fill(null));
  mixer: Record<string, unknown> | null = $state(null);
  generalSMPTEMode = $state(0);

  selectedLayer = $state(0);

  packetLog: PacketLogEntry[] = $state([]);
  logFilters: Record<string, boolean> = $state({
    time: false, status: true, metrics: true, metadata: true,
    optin: false, optout: true, cue: true, beatgrid: true,
    "waveform-small": true, "waveform-big": true, mixer: true, artwork: true,
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
