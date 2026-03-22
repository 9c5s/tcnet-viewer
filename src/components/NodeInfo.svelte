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

<section class="p-3 border-b border-base-content/20">
  <h3 class="section-title">Node</h3>
  <div class="flex items-center gap-2 mb-2">
    <span class="w-2 h-2 rounded-full flex-shrink-0 {store.connected ? 'bg-success' : 'bg-error'}"></span>
    <span class="text-[11px] text-base-content/70">{store.connected ? "Connected" : "Disconnected"}</span>
  </div>
  {#if store.node}
    <div class="space-y-1 text-[10px]">
      <div class="flex justify-between"><span class="text-base-content/40">Name</span><span class="text-base-content">{store.node.nodeName}</span></div>
      <div class="flex justify-between"><span class="text-base-content/40">Type</span><span class="text-base-content">{NODE_TYPES[store.node.nodeType] ?? `Unknown(${store.node.nodeType})`}</span></div>
      <div class="flex justify-between"><span class="text-base-content/40">Version</span><span class="text-base-content">{store.node.majorVersion}.{store.node.minorVersion}</span></div>
      <div class="flex justify-between"><span class="text-base-content/40">Protocol</span><span class="text-base-content">{store.node.protocolVersion}</span></div>
      <div class="flex justify-between"><span class="text-base-content/40">Uptime</span><span class="text-base-content">{formatUptime(store.node.uptime)}</span></div>
      <div class="flex justify-between"><span class="text-base-content/40">Nodes</span><span class="text-base-content">{store.node.nodeCount}</span></div>
    </div>
  {:else}
    <p class="text-[11px] text-base-content/40 italic">No node data</p>
  {/if}
</section>
