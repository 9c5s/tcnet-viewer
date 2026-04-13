<script lang="ts">
  import { dndzone, type DndEvent } from "svelte-dnd-action";
  import { store } from "$lib/stores.svelte.js";
  import type { Arrangement } from "$lib/types.js";
  import { mergeDraggedOrder, pickActive } from "$lib/player-status/ordering.js";
  import PlayerCard from "./PlayerCard.svelte";
  import PlayerToolbar from "./PlayerToolbar.svelte";

  type CardItem = { id: string; layerIndex: number };

  // L1-L4 (index 0-3) のうち status !== "IDLE" の index を集める
  let activeIndexes = $derived(
    new Set(
      store.layers
        .slice(0, 4)
        .map((l, i) => (l.status !== "IDLE" ? i : -1))
        .filter((i) => i >= 0),
    ),
  );

  let orderedActive = $derived(pickActive(store.playerStatusOrder, activeIndexes));

  // svelte-dnd-action は items を書き換え可能な state として要求するため、
  // $derived で読み取り専用値にせず $state + $effect で store から反映する
  let items = $state<CardItem[]>([]);
  $effect(() => {
    items = orderedActive.map((i) => ({ id: `player-${i}`, layerIndex: i }));
  });

  function onConsider(e: CustomEvent<DndEvent<CardItem>>) {
    items = e.detail.items;
  }

  function onFinalize(e: CustomEvent<DndEvent<CardItem>>) {
    const dragged = e.detail.items.map((it) => it.layerIndex);
    const merged = mergeDraggedOrder(store.playerStatusOrder, activeIndexes, dragged);
    store.playerStatusOrder = merged;
    try {
      localStorage.setItem("playerStatusOrder", JSON.stringify(merged));
    } catch {
      // localStorage 失敗は握り潰して動作継続する
    }
    items = e.detail.items;
  }

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
    next[layerIndex] = Math.min(Math.max(v, 1), 8);
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

  {#if items.length === 0}
    <div class="mt-20 flex flex-col items-center gap-2 text-base-content/40">
      <p class="text-lg">No active players</p>
      <p class="text-sm">Load a track on CDJ 1-4</p>
    </div>
  {:else}
    <div
      class={arrangeClass(store.playerStatusArrange, items.length)}
      use:dndzone={{ items, flipDurationMs: 200, type: "player-status-cards" }}
      onconsider={onConsider}
      onfinalize={onFinalize}
    >
      {#each items as item, idx (item.id)}
        {@const i = item.layerIndex}
        <div class={itemSpanClass(store.playerStatusArrange, items.length, idx)}>
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
            zoomScale={store.playerStatusZoom[i] ?? 2}
            onZoomChange={(v) => onZoomChange(i, v)}
          />
        </div>
      {/each}
    </div>
  {/if}
</div>
