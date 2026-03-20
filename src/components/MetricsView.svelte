<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  interface Props {
    layer: number;
  }
  let { layer }: Props = $props();

  let metrics = $derived(store.metrics[layer]);

  // ミリ秒をMM:SS.mmm形式に変換する
  function formatMmSs(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return (
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0") +
      "." +
      String(millis).padStart(3, "0")
    );
  }
</script>

<div class="metrics-view">
  <h3 class="section-title">METRICS</h3>
  {#if metrics}
    <div class="metrics-grid">
      <div class="metric-item">
        <span class="metric-label">BPM</span>
        <span class="metric-value bpm">{(metrics.bpm / 100).toFixed(2)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Speed</span>
        <span class="metric-value">{(metrics.speed / 32768 * 100).toFixed(1)}%</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Pitch</span>
        <span class="metric-value">{(metrics.pitchBend / 32768 * 100).toFixed(1)}%</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Position</span>
        <span class="metric-value">{formatMmSs(metrics.currentPosition)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Length</span>
        <span class="metric-value">{formatMmSs(metrics.trackLength)}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Beat</span>
        <span class="metric-value">
          {metrics.beatNumber}
          <span class="beat-indicator">
            {#each [1, 2, 3, 4] as b}
              <span class="beat-pip" class:active={metrics.beatMarker === b}></span>
            {/each}
          </span>
        </span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Sync</span>
        <span class="metric-value" class:sync-master={metrics.syncMaster === 1}>
          {metrics.syncMaster === 1 ? "Master" : "Slave"}
        </span>
      </div>
    </div>
  {:else}
    <p class="no-data">No metrics data</p>
  {/if}
</div>

<style>
  .metrics-view {
    flex: 1;
    min-width: 0;
  }
  .section-title {
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 6px;
    text-transform: uppercase;
  }
  .metrics-grid {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .metric-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2px 0;
  }
  .metric-label {
    color: var(--text-muted);
    font-size: 10px;
  }
  .metric-value {
    color: var(--text-primary);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .metric-value.bpm {
    color: var(--accent);
    font-weight: bold;
  }
  .beat-indicator {
    display: inline-flex;
    gap: 2px;
    margin-left: 4px;
    vertical-align: middle;
  }
  .beat-pip {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--bg-tertiary);
  }
  .beat-pip.active {
    background: var(--accent);
  }
  .sync-master {
    color: var(--yellow);
    font-weight: bold;
  }
  .no-data {
    color: var(--text-muted);
    font-size: 11px;
    font-style: italic;
  }
</style>
