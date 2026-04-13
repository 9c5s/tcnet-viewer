<script lang="ts">
  import type { Arrangement } from "$lib/types.js";

  interface Props {
    arrangement: Arrangement;
    onChange: (a: Arrangement) => void;
  }
  let { arrangement, onChange }: Props = $props();

  const modes: { key: Arrangement; label: string }[] = [
    { key: "stack", label: "Stack" },
    { key: "row", label: "Row" },
    { key: "grid", label: "Grid" },
  ];
</script>

<div class="mb-4 flex items-center justify-between rounded-md border border-base-content/20 bg-base-100 p-3 px-4">
  <div class="flex items-center gap-3">
    <span class="text-[10px] tracking-widest text-base-content/40 uppercase">Arrange</span>
    <div class="join">
      {#each modes as mode}
        <button
          class="btn join-item btn-sm"
          class:btn-primary={arrangement === mode.key}
          class:btn-ghost={arrangement !== mode.key}
          onclick={() => onChange(mode.key)}
        >
          {mode.label}
        </button>
      {/each}
    </div>
  </div>
  <span class="text-[11px] text-base-content/40">Drag any card to reorder</span>
</div>
