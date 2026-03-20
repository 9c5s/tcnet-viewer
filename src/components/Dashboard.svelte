<script lang="ts">
  import Sidebar from "./Sidebar.svelte";
  import LayerList from "./LayerList.svelte";
  import LayerDetail from "./LayerDetail.svelte";
  import PacketLog from "./PacketLog.svelte";
</script>

<div class="dashboard">
  <Sidebar />
  <div class="main-top">
    <LayerList />
    <LayerDetail />
  </div>
  <div class="main-bottom">
    <PacketLog />
  </div>
</div>

<style>
  .dashboard {
    display: grid;
    grid-template-columns: 200px 1fr;
    grid-template-rows: 1fr 200px;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }
  .main-top {
    display: flex;
    overflow: hidden;
  }
  .main-bottom {
    overflow: hidden;
  }
</style>
