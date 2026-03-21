<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
</script>

<div class="navbar bg-base-200 border-b border-base-content/20 min-h-8 px-3 py-0 pr-56 text-[11px]">
  <span class="w-2 h-2 rounded-full flex-shrink-0 {store.connected ? 'bg-success' : 'bg-error'}"></span>
  <span class="ml-2 text-base-content/70">{store.connected ? "Connected" : "Disconnected"}</span>
  {#if store.node}
    <span class="text-base-content/30 mx-2">|</span>
    <span class="text-accent font-bold">{store.node.nodeName}</span>
    <span class="text-base-content/30 mx-2">|</span>
    <span class="text-base-content/70">V{store.node.majorVersion}.{store.node.minorVersion}</span>
    <span class="text-base-content/30 mx-2">|</span>
    <span class="text-base-content/70">Protocol {store.node.protocolVersion}</span>
    <span class="text-base-content/30 mx-2">|</span>
    <span class="text-base-content/70">Nodes: {store.node.nodeCount}</span>
    <span class="text-base-content/30 mx-2">|</span>
    <span class="text-base-content/70">{store.node.vendorName} / {store.node.appName}</span>
  {/if}
</div>
