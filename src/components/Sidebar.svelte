<script lang="ts">
  import NodeInfo from "./NodeInfo.svelte";
  import TimecodeDisplay from "./TimecodeDisplay.svelte";
  import MixerView from "./MixerView.svelte";
</script>

<aside class="sidebar">
  <NodeInfo />
  <TimecodeDisplay />
  <MixerView />
</aside>

<style>
  .sidebar {
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    grid-row: 1 / -1;
  }
</style>
