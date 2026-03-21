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

<div class="p-3 border-b border-base-content/20">
  <h3 class="text-[10px] text-base-content/40 uppercase tracking-wider mb-2">Metrics</h3>
  {#if metrics}
    <div class="space-y-0.5 text-[10px]">
      <div class="flex justify-between">
        <span class="text-base-content/40">BPM</span>
        <span class="text-accent font-bold text-[11px]" style="font-variant-numeric: tabular-nums">
          {(metrics.bpm / 100).toFixed(2)}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Speed</span>
        <span class="text-base-content" style="font-variant-numeric: tabular-nums">{(metrics.speed / 32768 * 100).toFixed(1)}%</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Pitch</span>
        <span class="text-base-content" style="font-variant-numeric: tabular-nums">{(metrics.pitchBend / 32768 * 100).toFixed(1)}%</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Position</span>
        <span class="text-base-content" style="font-variant-numeric: tabular-nums">{formatMmSs(metrics.currentPosition)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Length</span>
        <span class="text-base-content" style="font-variant-numeric: tabular-nums">{formatMmSs(metrics.trackLength)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Beat</span>
        <span class="text-base-content">
          {metrics.beatNumber}
          <span class="inline-flex items-center gap-0.5 ml-1">
            {#each [1, 2, 3, 4] as b}
              <span class="w-[5px] h-[5px] rounded-full {metrics.beatMarker === b ? 'bg-accent' : 'bg-base-300'}"></span>
            {/each}
          </span>
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Sync</span>
        <span class="{metrics.syncMaster === 1 ? 'text-warning font-bold' : 'text-base-content'}">
          {metrics.syncMaster === 1 ? "Master" : "Slave"}
        </span>
      </div>
    </div>
  {:else}
    <div class="text-base-content/40 text-[11px]">No metrics data</div>
  {/if}
</div>
