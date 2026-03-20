<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES } from "$lib/types.js";
  import MetadataView from "./MetadataView.svelte";
  import WaveformCanvas from "./WaveformCanvas.svelte";
  import MetricsView from "./MetricsView.svelte";
  import CuePoints from "./CuePoints.svelte";

  let layer = $derived(store.selectedLayer);
  let timeInfo = $derived(store.time[layer]);
  let metrics = $derived(store.metrics[layer]);
  let waveform = $derived(store.waveformSmall[layer]);

  // ミリ秒をHH:MM:SS.mmm形式に変換する
  function formatTimecode(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return (
      String(h).padStart(2, "0") +
      ":" +
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0") +
      "." +
      String(millis).padStart(3, "0")
    );
  }
</script>

<div class="layer-detail">
  <div class="detail-header">
    <h2 class="layer-title">{LAYER_NAMES[layer]}</h2>
    <span class="layer-status">{store.layers[layer].status}</span>
    {#if store.layers[layer].name}
      <span class="device-name">{store.layers[layer].name}</span>
    {/if}
  </div>

  <div class="detail-scroll">
    <MetadataView {layer} />

    <WaveformCanvas
      bars={waveform}
      currentPosition={timeInfo?.currentTimeMillis ?? 0}
      trackLength={metrics?.trackLength ?? 0}
    />

    <div class="metrics-cue-row">
      <MetricsView {layer} />
      <CuePoints {layer} />
    </div>

    <div class="timecode-section">
      <h3 class="section-title">TIMECODE</h3>
      {#if timeInfo}
        <div class="tc-row">
          <span class="tc-label">Current</span>
          <span class="tc-value">{formatTimecode(timeInfo.currentTimeMillis)}</span>
        </div>
        <div class="tc-row">
          <span class="tc-label">Total</span>
          <span class="tc-value">{formatTimecode(timeInfo.totalTimeMillis)}</span>
        </div>
        <div class="tc-row">
          <span class="tc-label">State</span>
          <span class="tc-value">{timeInfo.state}</span>
        </div>
        <div class="tc-row">
          <span class="tc-label">OnAir</span>
          <span class="tc-value" class:on-air={timeInfo.onAir === 1}>
            {timeInfo.onAir === 1 ? "ON" : "OFF"}
          </span>
        </div>
      {:else}
        <p class="no-data">No timecode data</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .layer-detail {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .detail-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }
  .layer-title {
    font-size: 16px;
    color: var(--accent);
  }
  .layer-status {
    font-size: 11px;
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    padding: 2px 8px;
    border-radius: 4px;
  }
  .device-name {
    font-size: 11px;
    color: var(--text-muted);
  }
  .detail-scroll {
    flex: 1;
    overflow-y: auto;
  }
  .metrics-cue-row {
    display: flex;
    gap: 16px;
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }
  .timecode-section {
    padding: 12px;
  }
  .section-title {
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 6px;
    text-transform: uppercase;
  }
  .tc-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    font-size: 11px;
  }
  .tc-label {
    color: var(--text-muted);
  }
  .tc-value {
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .on-air {
    color: var(--green);
    font-weight: bold;
  }
  .no-data {
    color: var(--text-muted);
    font-size: 11px;
    font-style: italic;
  }
</style>
