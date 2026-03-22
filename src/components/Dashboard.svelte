<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import Sidebar from "./Sidebar.svelte";
  import LayerList from "./LayerList.svelte";
  import LayerDetail from "./LayerDetail.svelte";
  import PacketLog from "./PacketLog.svelte";
</script>

<div class="grid grid-cols-[200px_1fr] h-full w-full overflow-hidden" style:grid-template-rows="1fr {store.packetLogHeight}px">
  <Sidebar />
  <div class="flex overflow-hidden">
    <LayerList />
    <LayerDetail />
  </div>
  <div class="overflow-hidden">
    <PacketLog />
  </div>
</div>
