<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, statusBadgeClass } from "$lib/types.js";
</script>

<div class="w-48 border-r border-base-content/20 overflow-y-auto flex-shrink-0">
  <h3 class="text-[10px] text-base-content/40 uppercase tracking-wider px-3 pt-3 pb-1">Layers</h3>
  <ul class="menu menu-xs p-1">
    {#each store.layers as layer, i}
      <li>
        <button
          class="flex justify-between items-center {store.selectedLayer === i ? 'active' : ''}"
          onclick={() => (store.selectedLayer = i)}
        >
          <span class="font-bold">{LAYER_NAMES[i]}</span>
          <span class="badge badge-sm px-[0.5em] {statusBadgeClass(layer.status)}">{layer.status}</span>
        </button>
      </li>
    {/each}
  </ul>
</div>
