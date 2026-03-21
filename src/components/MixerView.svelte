<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  // 0-255の値をパーセンテージに変換する
  function toPercent(val: number): string {
    return ((val / 255) * 100).toFixed(0);
  }
</script>

<section class="mixer-view">
  <h3 class="section-title">MIXER</h3>
  {#if store.mixer}
    <div class="mixer-group">
      <div class="mixer-row">
        <span class="label">Master Audio</span>
        <div class="bar-container">
          <div class="bar-fill" style="width: {toPercent(store.mixer.masterAudioLevel)}%"></div>
        </div>
        <span class="value">{store.mixer.masterAudioLevel}</span>
      </div>
      <div class="mixer-row">
        <span class="label">Master Fader</span>
        <div class="bar-container">
          <div class="bar-fill" style="width: {toPercent(store.mixer.masterFaderLevel)}%"></div>
        </div>
        <span class="value">{store.mixer.masterFaderLevel}</span>
      </div>
      <div class="mixer-row">
        <span class="label">Cross Fader</span>
        <div class="bar-container">
          <div class="bar-fill crossfader" style="width: {toPercent(store.mixer.crossFader)}%"></div>
        </div>
        <span class="value">{store.mixer.crossFader}</span>
      </div>
    </div>
    <div class="mixer-group">
      <div class="mixer-row">
        <span class="label">BeatFX</span>
        <span class="value" class:fx-on={store.mixer.beatFxOn}>
          {store.mixer.beatFxOn ? "ON" : "OFF"}
        </span>
      </div>
      <div class="mixer-row">
        <span class="label">FX Select</span>
        <span class="value">{store.mixer.beatFxSelect ?? "-"}</span>
      </div>
    </div>
  {:else}
    <p class="no-data">No mixer data</p>
  {/if}
</section>

<style>
  .mixer-view {
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
  .mixer-group {
    margin-bottom: 8px;
  }
  .mixer-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 3px 0;
  }
  .label {
    color: var(--text-muted);
    font-size: 10px;
    min-width: 80px;
    flex-shrink: 0;
  }
  .bar-container {
    flex: 1;
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    overflow: hidden;
  }
  .bar-fill {
    height: 100%;
    background: var(--green);
    border-radius: 3px;
    transition: width 0.1s ease;
  }
  .bar-fill.crossfader {
    background: var(--yellow);
  }
  .value {
    color: var(--text-secondary);
    font-size: 10px;
    min-width: 24px;
    text-align: right;
  }
  .fx-on {
    color: var(--green);
    font-weight: bold;
  }
  .no-data {
    color: var(--text-muted);
    font-size: 11px;
    font-style: italic;
  }
</style>
