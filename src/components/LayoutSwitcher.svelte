<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import type { LayoutMode } from "$lib/stores.svelte.js";

  const modes: { key: LayoutMode; label: string; icon: string }[] = [
    { key: "cards", label: "Cards", icon: "\u25A6" },
    { key: "detail", label: "Detail", icon: "\u25A3" },
    { key: "table", label: "Table", icon: "\u2261" },
  ];
</script>

<div class="layout-switcher">
  {#each modes as mode}
    <button
      class="switcher-btn"
      class:active={store.layoutMode === mode.key}
      onclick={() => (store.layoutMode = mode.key)}
      title="{mode.label} layout"
    >
      <span class="btn-icon">{mode.icon}</span>
      <span class="btn-label">{mode.label}</span>
    </button>
  {/each}
</div>

<style>
  .layout-switcher {
    position: fixed;
    top: 8px;
    right: 8px;
    z-index: 1000;
    display: flex;
    gap: 2px;
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 2px;
  }
  .switcher-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: 11px;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .switcher-btn:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
  .switcher-btn.active {
    background: var(--accent);
    color: #0d1117;
  }
  .btn-icon {
    font-size: 13px;
    line-height: 1;
  }
  .btn-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
