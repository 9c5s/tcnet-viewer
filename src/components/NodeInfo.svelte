<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  const NODE_TYPES: Record<number, string> = {
    1: "Auto",
    2: "Master",
    4: "Slave",
    8: "Repeater",
  };

  // アップタイムを人間が読める形式に変換する
  function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  }
</script>

<section class="node-info">
  <h3 class="section-title">NODE INFO</h3>
  <div class="status-row">
    <span class="status-dot" class:connected={store.connected}></span>
    <span class="status-text">{store.connected ? "Connected" : "Disconnected"}</span>
  </div>
  {#if store.node}
    <div class="info-row">
      <span class="label">Name</span>
      <span class="value">{store.node.nodeName}</span>
    </div>
    <div class="info-row">
      <span class="label">Type</span>
      <span class="value">{NODE_TYPES[store.node.nodeType] ?? `Unknown(${store.node.nodeType})`}</span>
    </div>
    <div class="info-row">
      <span class="label">Version</span>
      <span class="value">V{store.node.majorVersion}.{store.node.minorVersion}</span>
    </div>
    <div class="info-row">
      <span class="label">Protocol</span>
      <span class="value">{store.node.protocolVersion}</span>
    </div>
    <div class="info-row">
      <span class="label">Uptime</span>
      <span class="value">{formatUptime(store.node.uptime)}</span>
    </div>
    <div class="info-row">
      <span class="label">Nodes</span>
      <span class="value">{store.node.nodeCount}</span>
    </div>
  {:else}
    <p class="no-data">No node data</p>
  {/if}
</section>

<style>
  .node-info {
    padding: 12px;
    border-bottom: 1px solid var(--border);
  }
  .section-title {
    font-size: 10px;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin-bottom: 8px;
    text-transform: uppercase;
  }
  .status-row {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--red);
    flex-shrink: 0;
  }
  .status-dot.connected {
    background: var(--green);
  }
  .status-text {
    font-size: 11px;
    color: var(--text-secondary);
  }
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
  }
  .label {
    color: var(--text-muted);
    font-size: 11px;
  }
  .value {
    color: var(--text-primary);
    font-size: 11px;
  }
  .no-data {
    color: var(--text-muted);
    font-size: 11px;
    font-style: italic;
  }
</style>
