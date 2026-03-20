<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

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

  let timeInfo = $derived(store.time[store.selectedLayer]);
</script>

<section class="timecode">
  <h3 class="section-title">TIMECODE</h3>
  {#if timeInfo}
    <div class="time-display">
      {formatTimecode(timeInfo.currentTimeMillis)}
    </div>
    <div class="time-details">
      <div class="info-row">
        <span class="label">Total</span>
        <span class="value">{formatMmSs(timeInfo.totalTimeMillis)}</span>
      </div>
      <div class="info-row">
        <span class="label">Beat</span>
        <span class="value">
          {#each [1, 2, 3, 4] as beat}
            <span class="beat-dot" class:active={timeInfo.beatMarker === beat}>{beat}</span>
          {/each}
        </span>
      </div>
      <div class="info-row">
        <span class="label">OnAir</span>
        <span class="value" class:on-air={timeInfo.onAir === 1}>
          {timeInfo.onAir === 1 ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  {:else}
    <div class="time-display dim">--:--:--.---</div>
  {/if}
</section>

<style>
  .timecode {
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }
  .section-title {
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .time-display {
    font-size: 18px;
    color: var(--accent);
    text-align: center;
    padding: 8px 0;
    font-variant-numeric: tabular-nums;
  }
  .time-display.dim {
    color: var(--text-muted);
  }
  .time-details {
    margin-top: 4px;
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
  }
  .label {
    color: var(--text-muted);
    font-size: 11px;
  }
  .value {
    color: var(--text-primary);
    font-size: 11px;
  }
  .beat-dot {
    display: inline-block;
    width: 16px;
    height: 16px;
    line-height: 16px;
    text-align: center;
    border-radius: 3px;
    font-size: 10px;
    color: var(--text-muted);
    background: var(--bg-tertiary);
    margin-left: 2px;
  }
  .beat-dot.active {
    background: var(--accent);
    color: var(--bg-primary);
  }
  .on-air {
    color: var(--green);
    font-weight: bold;
  }
</style>
