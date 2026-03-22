<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  // 0-255の値をパーセンテージに変換する
  function toPercent(val: number): string {
    return ((val / 255) * 100).toFixed(0);
  }
</script>

<section class="p-3 border-b border-base-content/20">
  <h3 class="text-[10px] text-base-content/40 uppercase tracking-wider mb-2">Mixer</h3>
  {#if store.mixer}
    <div class="space-y-1.5">
      <div class="space-y-0.5">
        <div class="flex justify-between text-[10px]">
          <span class="text-base-content/40">Master</span>
          <span class="text-base-content" style="font-variant-numeric: tabular-nums">{toPercent(store.mixer.masterAudioLevel)}%</span>
        </div>
        <progress class="progress progress-success h-1.5 w-full" value={store.mixer.masterAudioLevel} max="255"></progress>
      </div>
      <div class="space-y-0.5">
        <div class="flex justify-between text-[10px]">
          <span class="text-base-content/40">Fader</span>
          <span class="text-base-content" style="font-variant-numeric: tabular-nums">{toPercent(store.mixer.masterFaderLevel)}%</span>
        </div>
        <progress class="progress progress-success h-1.5 w-full" value={store.mixer.masterFaderLevel} max="255"></progress>
      </div>
      <div class="space-y-0.5">
        <div class="flex justify-between text-[10px]">
          <span class="text-base-content/40">CrossFader</span>
          <span class="text-base-content" style="font-variant-numeric: tabular-nums">{toPercent(store.mixer.crossFader)}%</span>
        </div>
        <progress class="progress progress-warning h-1.5 w-full" value={store.mixer.crossFader} max="255"></progress>
      </div>
      <div class="flex justify-between items-center text-[10px]">
        <span class="text-base-content/40">BeatFX</span>
        <span class="badge badge-outline badge-sm px-[0.5em] {store.mixer.beatFxOn ? 'badge-success' : ''}">{store.mixer.beatFxOn ? "ON" : "OFF"}</span>
      </div>
      <div class="flex justify-between text-[10px]">
        <span class="text-base-content/40">FX Select</span>
        <span class="text-base-content">{store.mixer.beatFxSelect ?? "-"}</span>
      </div>
    </div>
  {:else}
    <div class="text-base-content/40 text-[11px]">No mixer data</div>
  {/if}
</section>
