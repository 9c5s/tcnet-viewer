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

<section class="p-3 border-b border-base-content/20">
  <h3 class="text-[10px] text-base-content/40 uppercase tracking-wider mb-2">Timecode</h3>
  {#if timeInfo}
    <div class="text-lg text-base-content font-bold tracking-wider mb-2" style="font-variant-numeric: tabular-nums">
      {formatTimecode(timeInfo.currentTimeMillis)}
    </div>
    <div class="space-y-1 text-[10px]">
      <div class="flex justify-between">
        <span class="text-base-content/40">Total</span>
        <span class="text-base-content" style="font-variant-numeric: tabular-nums">{formatMmSs(timeInfo.totalTimeMillis)}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">Beat</span>
        <span class="flex items-center gap-1">
          {#each [1, 2, 3, 4] as beat}
            <span class="w-[5px] h-[5px] rounded-full {timeInfo.beatMarker === beat ? 'bg-accent' : 'bg-base-300'}">{beat}</span>
          {/each}
        </span>
      </div>
      <div class="flex justify-between">
        <span class="text-base-content/40">OnAir</span>
        <span class="{timeInfo.onAir === 1 ? 'text-success font-bold' : 'text-base-content'}">
          {timeInfo.onAir === 1 ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  {:else}
    <div class="text-lg text-base-content/40 font-bold tracking-wider">--:--:--.---</div>
  {/if}
</section>
