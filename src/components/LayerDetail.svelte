<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, statusBadgeClass } from "$lib/types.js";
  import MetadataView from "./MetadataView.svelte";
  import WaveformSvg from "./WaveformSvg.svelte";
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

<div class="flex-1 flex flex-col overflow-hidden">
  <div class="flex items-center gap-3 px-4 py-2 border-b border-base-content/20 bg-base-300 flex-shrink-0">
    <h2 class="font-bold text-base-content">{LAYER_NAMES[layer]}</h2>
    <span class="badge badge-sm {statusBadgeClass(store.layers[layer].status)}">{store.layers[layer].status}</span>
    {#if store.layers[layer].name}
      <span class="text-base-content/40 text-[10px]">{store.layers[layer].name}</span>
    {/if}
  </div>
  <div class="flex-1 overflow-y-auto p-2 space-y-2">
    <MetadataView {layer} />
    <WaveformSvg
      bars={waveform}
      currentPosition={timeInfo?.currentTimeMillis ?? 0}
      trackLength={metrics?.trackLength ?? 0}
    />
    <div class="flex gap-2">
      <div class="flex-1"><MetricsView {layer} /></div>
      <div class="flex-1"><CuePoints {layer} /></div>
    </div>
    <div class="p-2">
      <h3 class="text-[10px] text-base-content/40 uppercase tracking-wider mb-1">Timecode</h3>
      {#if timeInfo}
        <div class="flex justify-between py-0.5 text-[11px]">
          <span class="text-base-content/40">Current</span>
          <span class="tabular-nums">{formatTimecode(timeInfo.currentTimeMillis)}</span>
        </div>
        <div class="flex justify-between py-0.5 text-[11px]">
          <span class="text-base-content/40">Total</span>
          <span class="tabular-nums">{formatTimecode(timeInfo.totalTimeMillis)}</span>
        </div>
        <div class="flex justify-between py-0.5 text-[11px]">
          <span class="text-base-content/40">State</span>
          <span class="tabular-nums">{timeInfo.state}</span>
        </div>
        <div class="flex justify-between py-0.5 text-[11px]">
          <span class="text-base-content/40">OnAir</span>
          <span class="tabular-nums {timeInfo.onAir === 1 ? 'text-success font-bold' : ''}">
            {timeInfo.onAir === 1 ? "ON" : "OFF"}
          </span>
        </div>
      {:else}
        <p class="text-base-content/40 text-[11px] italic">No timecode data</p>
      {/if}
    </div>
  </div>
</div>
