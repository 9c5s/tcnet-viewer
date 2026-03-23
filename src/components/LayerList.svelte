<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, statusBadgeClass } from "$lib/types.js";
</script>

<div class="w-48 shrink-0 overflow-y-auto border-r border-base-content/20">
  <h3 class="section-title mb-0! px-3 pt-3 pb-1">Layers</h3>
  <ul class="menu menu-xs p-1">
    {#each store.layers as layer, i}
      <li>
        <button
          class="flex items-center justify-between {store.selectedLayer === i ? 'active' : ''}"
          onclick={() => (store.selectedLayer = i)}
        >
          <span class="font-bold">{LAYER_NAMES[i]}</span>
          <span class="status-badge w-20 justify-center {statusBadgeClass(layer.status)}">{layer.status}</span>
        </button>
      </li>
    {/each}
  </ul>
</div>
