<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import type { Arrangement } from "$lib/types.js";
  import { ZOOM_MAX, ZOOM_MIN } from "$lib/player-status/waveform-canvas/draw-math.js";
  import PlayerCard from "./PlayerCard.svelte";
  import PlayerToolbar from "./PlayerToolbar.svelte";

  // L1-L4 (index 0-3) のうち status !== "IDLE" の index を L1->L4 順で抽出する
  let activeIndexes = $derived(
    store.layers
      .slice(0, 4)
      .map((l, i) => (l.status !== "IDLE" ? i : -1))
      .filter((i) => i >= 0),
  );

  function arrangeClass(a: Arrangement, count: number): string {
    if (a === "row") return "flex flex-row gap-5";
    if (a === "grid" && count >= 2) return "grid grid-cols-2 gap-5";
    return "flex flex-col gap-5";
  }

  // grid 3枚時のみ 3枚目を横2列に伸ばしてバランスを取る
  function itemSpanClass(a: Arrangement, count: number, idx: number): string {
    return a === "grid" && count === 3 && idx === 2 ? "col-span-2" : "";
  }

  function onArrangeChange(a: Arrangement) {
    store.playerStatusArrange = a;
    try {
      localStorage.setItem("playerStatusArrange", a);
    } catch {
      // noop
    }
  }

  function onZoomChange(layerIndex: number, v: number) {
    const next = [...store.playerStatusZoom];
    next[layerIndex] = Math.min(Math.max(Math.round(v), ZOOM_MIN), ZOOM_MAX);
    store.playerStatusZoom = next;
    try {
      localStorage.setItem("playerStatusZoom", JSON.stringify(next));
    } catch {
      // noop
    }
  }
</script>

<div class="min-h-screen bg-base-300 p-5">
  <PlayerToolbar arrangement={store.playerStatusArrange} onChange={onArrangeChange} />

  {#if activeIndexes.length === 0}
    <div class="mt-20 flex flex-col items-center gap-2 text-base-content/40">
      <p class="text-lg">No active players</p>
      <p class="text-sm">Load a track on CDJ 1-4</p>
    </div>
  {:else}
    <div class={arrangeClass(store.playerStatusArrange, activeIndexes.length)}>
      {#each activeIndexes as i, idx (i)}
        <div class={itemSpanClass(store.playerStatusArrange, activeIndexes.length, idx)}>
          <PlayerCard
            layer={store.layers[i]!}
            layerIndex={i}
            playerNumber={i + 1}
            metadata={store.metadata[i] ?? null}
            metrics={store.metrics[i] ?? null}
            time={store.time[i] ?? null}
            artwork={store.artwork[i] ?? null}
            artworkFailed={store.artworkFailed[i] ?? false}
            waveformBig={store.waveformBig[i] ?? null}
            waveformSmall={store.waveformSmall[i] ?? null}
            cues={store.cues[i] ?? null}
            beatgrid={store.beatgrid[i] ?? null}
            zoomScale={store.playerStatusZoom[i] ?? ZOOM_MIN}
            onZoomChange={(v) => onZoomChange(i, v)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
