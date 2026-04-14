<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, statusBadgeClass } from "$lib/types.js";
  import { formatTimecode } from "$lib/formatting.js";
  import MetadataView from "./MetadataView.svelte";
  import WaveformSvg from "./WaveformSvg.svelte";
  import MetricsView from "./MetricsView.svelte";
  import CuePoints from "./CuePoints.svelte";

  let layer = $derived(store.selectedLayer);
  let timeInfo = $derived(store.time[layer]);
  let metrics = $derived(store.metrics[layer]);
  let waveform = $derived(store.waveformSmall[layer]);
</script>

<div class="flex flex-1 flex-col overflow-hidden">
  <div class="flex shrink-0 items-center gap-3 border-b border-base-content/20 bg-base-300 px-4 py-2">
    <h2 class="font-bold text-base-content">{LAYER_NAMES[layer]}</h2>
    <span class="status-badge {statusBadgeClass(store.layers[layer].status)}">{store.layers[layer].status}</span>
    {#if store.layers[layer].name}
      <span class="text-[10px] text-base-content/40">{store.layers[layer].name}</span>
    {/if}
  </div>
  <div class="flex-1 space-y-2 overflow-y-auto p-2">
    <MetadataView {layer} />
    <WaveformSvg
      bars={waveform}
      cues={store.cues[layer]}
      status={store.layers[layer].status}
      currentPosition={timeInfo?.currentTimeMillis ?? 0}
      trackLength={metrics?.trackLength ?? 0}
    />
    <div class="flex gap-2">
      <div class="flex-1"><MetricsView {layer} /></div>
      <div class="flex-1"><CuePoints {layer} /></div>
    </div>
    <div class="p-2">
      <h3 class="mb-1 text-[10px] tracking-wider text-base-content/40 uppercase">Timecode</h3>
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
          <span class="tabular-nums" class:font-bold={timeInfo.onAir === 1} class:text-success={timeInfo.onAir === 1}>
            {timeInfo.onAir === 1 ? "ON" : "OFF"}
          </span>
        </div>
      {:else}
        <p class="text-[11px] text-base-content/40 italic">No timecode data</p>
      {/if}
    </div>
  </div>
</div>
