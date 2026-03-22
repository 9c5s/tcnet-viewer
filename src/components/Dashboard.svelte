<script lang="ts">
  import Sidebar from "./Sidebar.svelte";
  import LayerList from "./LayerList.svelte";
  import LayerDetail from "./LayerDetail.svelte";
  import PacketLog from "./PacketLog.svelte";
</script>

<div class="grid grid-cols-[200px_1fr] grid-rows-[1fr_200px] h-full w-full overflow-hidden">
  <Sidebar />
  <div class="flex overflow-hidden">
    <LayerList />
    <LayerDetail />
  </div>
  <div class="overflow-hidden">
    <PacketLog />
  </div>
</div>
