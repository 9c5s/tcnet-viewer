<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { formatTimecode, formatMmSs } from "$lib/formatting.js";

  let timeInfo = $derived(store.time[store.selectedLayer]);
</script>

<section class="border-b border-base-content/20 p-3">
  <h3 class="section-title">Timecode</h3>
  {#if timeInfo}
    <div class="mb-2 text-lg font-bold tracking-wider text-base-content tabular-nums">
      {formatTimecode(timeInfo.currentTimeMillis)}
    </div>
    <div class="space-y-1 text-[10px]">
      <div class="flex justify-between">
        <span class="text-base-content/40">Total</span>
        <span class="text-base-content tabular-nums">{formatMmSs(timeInfo.totalTimeMillis)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Beat</span>
        <span class="flex items-center gap-1">
          {#each [1, 2, 3, 4] as beat}
            <span class="size-[5px] rounded-full" class:bg-accent={timeInfo.beatMarker === beat} class:bg-base-300={timeInfo.beatMarker !== beat}></span>
          {/each}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">OnAir</span>
        <span class:font-bold={timeInfo.onAir === 1} class:text-success={timeInfo.onAir === 1} class:text-base-content={timeInfo.onAir !== 1}>
          {timeInfo.onAir === 1 ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  {:else}
    <div class="text-lg font-bold tracking-wider text-base-content/40">--:--:--.---</div>
  {/if}
</section>
