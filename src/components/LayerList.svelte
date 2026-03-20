<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES } from "$lib/types.js";
  import type { LayerStatus } from "$lib/types.js";

  // レイヤーステータスに応じた色を返す
  function statusColor(status: LayerStatus): string {
    switch (status) {
      case "IDLE":
        return "var(--text-muted)";
      case "PLAYING":
      case "LOOPING":
        return "var(--green)";
      case "PAUSED":
        return "var(--yellow)";
      case "STOPPED":
        return "var(--red)";
      default:
        return "var(--text-secondary)";
    }
  }
</script>

<div class="layer-list">
  <h3 class="section-title">LAYERS</h3>
  {#each store.layers as layer, i}
    <button
      class="layer-item"
      class:selected={store.selectedLayer === i}
      onclick={() => (store.selectedLayer = i)}
    >
      <div class="layer-header">
        <span class="layer-name">{LAYER_NAMES[i]}</span>
        <span class="layer-status" style="color: {statusColor(layer.status)}">{layer.status}</span>
      </div>
      {#if layer.name}
        <div class="device-name">{layer.name}</div>
      {/if}
    </button>
  {/each}
</div>

<style>
  .layer-list {
    width: 150px;
    flex-shrink: 0;
    border-right: 1px solid var(--border);
    overflow-y: auto;
    padding: 8px;
  }
  .section-title {
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 8px;
    padding: 0 4px;
    text-transform: uppercase;
  }
  .layer-item {
    display: block;
    width: 100%;
    padding: 8px;
    margin-bottom: 4px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-primary);
    transition: border-color 0.15s;
  }
  .layer-item:hover {
    border-color: var(--text-muted);
  }
  .layer-item.selected {
    border-color: var(--accent);
    background: var(--bg-tertiary);
  }
  .layer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .layer-name {
    font-weight: bold;
    color: var(--text-primary);
  }
  .layer-status {
    font-size: 9px;
    text-transform: uppercase;
  }
  .device-name {
    font-size: 9px;
    color: var(--text-secondary);
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
