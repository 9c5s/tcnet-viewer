<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  interface Props {
    layer: number;
  }
  let { layer }: Props = $props();

  let cues = $derived(store.cues[layer]);

  // ミリ秒をMM:SS.mmm形式に変換する
  function formatMmSs(ms: number): string {
    if (ms <= 0) return "--:--.---";
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

  // CUEタイプ名を返す
  function cueTypeName(type: number): string {
    switch (type) {
      case 0: return "CUE";
      case 1: return "IN";
      case 2: return "OUT";
      case 3: return "LOOP";
      default: return `T${type}`;
    }
  }
</script>

<div class="cue-points">
  <h3 class="section-title">CUE POINTS</h3>
  {#if cues && cues.length > 0}
    <div class="cue-list">
      {#each cues as cue}
        <div class="cue-item">
          <span
            class="cue-color"
            style="background: rgb({cue.color.r}, {cue.color.g}, {cue.color.b})"
          ></span>
          <span class="cue-index">#{cue.index}</span>
          <span class="cue-type">{cueTypeName(cue.type)}</span>
          <span class="cue-time">{formatMmSs(cue.inTime)}</span>
          {#if cue.outTime > 0}
            <span class="cue-out">- {formatMmSs(cue.outTime)}</span>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <p class="no-data">No cue points</p>
  {/if}
</div>

<style>
  .cue-points {
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
  .cue-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .cue-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
    font-size: 10px;
  }
  .cue-color {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .cue-index {
    color: var(--text-muted);
    min-width: 18px;
  }
  .cue-type {
    color: var(--text-secondary);
    min-width: 32px;
  }
  .cue-time {
    color: var(--text-primary);
    font-variant-numeric: tabular-nums;
  }
  .cue-out {
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
  }
  .no-data {
    color: var(--text-muted);
    font-size: 11px;
    font-style: italic;
  }
</style>
