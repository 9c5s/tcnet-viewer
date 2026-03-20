<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
</script>

<div class="node-bar">
  <span class="dot" class:connected={store.connected}></span>
  <span class="conn-text">{store.connected ? "Connected" : "Disconnected"}</span>
  {#if store.node}
    <span class="sep">|</span>
    <span class="node-name">{store.node.nodeName}</span>
    <span class="sep">|</span>
    <span class="node-detail">V{store.node.majorVersion}.{store.node.minorVersion}</span>
    <span class="sep">|</span>
    <span class="node-detail">Protocol {store.node.protocolVersion}</span>
    <span class="sep">|</span>
    <span class="node-detail">Nodes: {store.node.nodeCount}</span>
    <span class="sep">|</span>
    <span class="node-detail">{store.node.vendorName} / {store.node.appName}</span>
  {/if}
</div>

<style>
  .node-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    font-size: 11px;
    flex-shrink: 0;
    /* LayoutSwitcherのスペースを確保する */
    padding-right: 220px;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--red);
    flex-shrink: 0;
  }
  .dot.connected {
    background: var(--green);
  }
  .conn-text {
    color: var(--text-secondary);
  }
  .sep {
    color: var(--text-muted);
    user-select: none;
  }
  .node-name {
    color: var(--accent);
    font-weight: bold;
  }
  .node-detail {
    color: var(--text-secondary);
  }
</style>
