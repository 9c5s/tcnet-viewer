<script lang="ts">
  import type {
    BeatGridEntry,
    CuePoint,
    LayerInfo,
    MetadataData,
    MetricsData,
    TimeInfo,
    WaveformBar,
  } from "$lib/types.js";
  import { derivePlaybackPosition } from "$lib/player-status/playback-position.js";
  import { isMetricsConsistent } from "$lib/player-status/track-consistency.js";
  import PlayerHeader from "./PlayerHeader.svelte";
  import PlayerStatusBar from "./PlayerStatusBar.svelte";
  import WaveformCanvas from "./WaveformCanvas.svelte";
  import WaveformSvg from "../WaveformSvg.svelte";

  interface Props {
    layer: LayerInfo;
    layerIndex: number;
    playerNumber: number;
    metadata: MetadataData | null;
    metrics: MetricsData | null;
    time: TimeInfo | null;
    artwork: { base64: string; mimeType: string } | null;
    artworkFailed: boolean;
    waveformBig: WaveformBar[] | null;
    waveformSmall: WaveformBar[] | null;
    cues: CuePoint[] | null;
    beatgrid: BeatGridEntry[] | null;
    zoomScale: number;
    onZoomChange: (v: number) => void;
  }
  let {
    layer,
    playerNumber,
    metadata,
    metrics,
    time,
    artwork,
    artworkFailed,
    waveformBig,
    waveformSmall,
    cues,
    beatgrid,
    zoomScale,
    onZoomChange,
  }: Props = $props();

  // metrics 整合性を検査し、不整合なら derivePlaybackPosition へ null を渡す
  let metricsOk = $derived(isMetricsConsistent(layer, metrics));
  let position = $derived(derivePlaybackPosition(time, metricsOk ? metrics : null));
</script>

<div
  data-testid="player-card"
  class="card relative overflow-hidden rounded-xl border border-base-content/20 bg-base-100 shadow-xl"
>
  <div data-testid="player-header">
    <PlayerHeader {layer} {playerNumber} {metadata} {metrics} {artwork} {artworkFailed} />
  </div>

  <div data-testid="player-zoom">
    <WaveformCanvas
      bars={waveformBig}
      {cues}
      {beatgrid}
      status={layer.status}
      currentTimeMs={position.clampedElapsedMs}
      trackLengthMs={position.trackLengthMs}
      {zoomScale}
      {onZoomChange}
    />
  </div>

  <div data-testid="player-status-bar">
    <PlayerStatusBar {layer} {playerNumber} {time} {metrics} />
  </div>

  <div data-testid="player-full" class="px-3 pb-2">
    <span class="mb-0.5 block text-[8px] tracking-widest text-base-content/40 uppercase">Full Track</span>
    <WaveformSvg
      bars={waveformSmall}
      {cues}
      status={layer.status}
      currentPosition={position.clampedElapsedMs}
      trackLength={position.trackLengthMs}
      height={28}
    />
  </div>
</div>
