<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { formatMmSs } from "$lib/formatting.js";

  interface Props {
    layer: number;
  }
  let { layer }: Props = $props();

  let metrics = $derived(store.metrics[layer]);
</script>

<div class="border-b border-base-content/20 p-3">
  <h3 class="section-title">Metrics</h3>
  {#if metrics}
    <div class="space-y-0.5 text-[10px]">
      <div class="flex justify-between">
        <span class="text-base-content/40">BPM</span>
        <span class="text-[11px] font-bold text-accent tabular-nums">
          {((metrics.bpm ?? 0) / 100).toFixed(2)}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Speed</span>
        <span class="text-base-content tabular-nums">{((metrics.speed ?? 0) / 32768 * 100).toFixed(1)}%</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Pitch</span>
        <span class="text-base-content tabular-nums">{((metrics.pitchBend ?? 0) / 32768 * 100).toFixed(1)}%</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Position</span>
        <span class="text-base-content tabular-nums">{formatMmSs(metrics.currentPosition ?? 0)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Length</span>
        <span class="text-base-content tabular-nums">{formatMmSs(metrics.trackLength ?? 0)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Beat</span>
        <span class="text-base-content">
          {metrics.beatNumber}
          <span class="ml-1 inline-flex items-center gap-0.5">
            {#each [1, 2, 3, 4] as b}
              <span class="size-[5px] rounded-full {metrics.beatMarker === b ? 'bg-accent' : 'bg-base-300'}"></span>
            {/each}
          </span>
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Sync</span>
        <span class="{metrics.syncMaster === 1 ? 'font-bold text-warning' : 'text-base-content'}">
          {metrics.syncMaster === 1 ? "Master" : "Slave"}
        </span>
      </div>
    </div>
  {:else}
    <div class="text-[11px] text-base-content/40">No metrics data</div>
  {/if}
</div>
