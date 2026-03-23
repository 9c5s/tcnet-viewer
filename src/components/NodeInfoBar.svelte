<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
</script>

<div class="navbar min-h-8 border-b border-base-content/20 bg-base-200 px-3 py-0 pr-56 text-[11px]">
  <span class="size-2 shrink-0 rounded-full {store.connected ? 'bg-success' : 'bg-error'}"></span>
  <span class="ml-2 text-base-content/70">{store.connected ? "Connected" : "Disconnected"}</span>
  {#if store.node}
    <span class="mx-2 text-base-content/30">|</span>
    <span class="font-bold text-accent">{store.node.nodeName}</span>
    <span class="mx-2 text-base-content/30">|</span>
    <span class="text-base-content/70">V{store.node.majorVersion}.{store.node.minorVersion}</span>
    <span class="mx-2 text-base-content/30">|</span>
    <span class="text-base-content/70">Protocol {store.node.protocolVersion}</span>
    <span class="mx-2 text-base-content/30">|</span>
    <span class="text-base-content/70">Nodes: {store.node.nodeCount}</span>
    <span class="mx-2 text-base-content/30">|</span>
    <span class="text-base-content/70">{store.node.vendorName} / {store.node.appName}</span>
  {/if}
</div>
