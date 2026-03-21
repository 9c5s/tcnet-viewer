<script lang="ts">
  import NodeInfo from "./NodeInfo.svelte";
  import TimecodeDisplay from "./TimecodeDisplay.svelte";
  import MixerView from "./MixerView.svelte";
</script>

<aside class="bg-base-200 border-r border-base-content/20 overflow-y-auto row-span-2">
  <NodeInfo />
  <TimecodeDisplay />
  <MixerView />
</aside>
