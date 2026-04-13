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

<!--
  ドラッグハンドルは PlayerHeader 部分のみに限定する。
  波形領域やスライダー・ステータスバーで pointerdown しても dndzone が反応しないよう、
  各セクションで stopPropagation する。
-->
<div
  data-testid="player-card"
  class="
    card relative overflow-hidden rounded-xl border border-base-content/20 bg-base-100 shadow-xl transition-colors
    hover:border-primary
  "
>
  <div data-testid="player-header" class="cursor-grab" title="Drag here to reorder">
    <PlayerHeader {layer} {playerNumber} {metadata} {metrics} {artwork} {artworkFailed} />
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div data-testid="player-zoom" onpointerdown={(e) => e.stopPropagation()}>
    <WaveformCanvas
      bars={waveformBig}
      {cues}
      {beatgrid}
      currentTimeMs={position.clampedElapsedMs}
      trackLengthMs={position.trackLengthMs}
      {zoomScale}
      {onZoomChange}
    />
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div data-testid="player-status-bar" onpointerdown={(e) => e.stopPropagation()}>
    <PlayerStatusBar {layer} {time} {metrics} />
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div data-testid="player-full" class="px-5 pb-4" onpointerdown={(e) => e.stopPropagation()}>
    <span class="mb-1 block text-[9px] tracking-widest text-base-content/40 uppercase">Full Track</span>
    <WaveformSvg
      bars={waveformSmall}
      {cues}
      currentPosition={position.clampedElapsedMs}
      trackLength={position.trackLengthMs}
      height={36}
    />
  </div>
</div>
