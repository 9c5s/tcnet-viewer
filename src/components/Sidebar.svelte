<script lang="ts">
  import NodeInfo from "./NodeInfo.svelte";
  import TimecodeDisplay from "./TimecodeDisplay.svelte";
  import MixerView from "./MixerView.svelte";
</script>

<aside class="row-span-2 overflow-y-auto border-r border-base-content/20 bg-base-200">
  <NodeInfo />
  <TimecodeDisplay />
  <MixerView />
</aside>
