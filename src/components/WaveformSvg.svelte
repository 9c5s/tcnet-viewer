<script lang="ts">
  import type { WaveformBar } from "$lib/types.js";

  interface Props {
    bars: WaveformBar[] | null;
    currentPosition: number;
    trackLength: number;
    height?: number;
    class?: string;
  }
  let { bars, currentPosition, trackLength, height = 80, class: className = "" }: Props = $props();

  const VIEW_WIDTH = 400;
  let barWidth = $derived(bars && bars.length > 0 ? VIEW_WIDTH / bars.length : 0);
  let posX = $derived(trackLength > 0 ? (currentPosition / trackLength) * VIEW_WIDTH : 0);
</script>

<div class="border-b border-base-content/20 px-2 py-1 {className}">
  {#if bars && bars.length > 0}
    <svg
      viewBox="0 0 {VIEW_WIDTH} {height}"
      preserveAspectRatio="none"
      class="block w-full rounded-sm"
      style:height="{height}px"
    >
      <rect width={VIEW_WIDTH} height={height} class="fill-base-100" />
      {#each bars as bar, i}
        {@const barHeight = (bar.level / 255) * height}
        <rect
          x={i * barWidth}
          y={height - barHeight}
          width={Math.max(barWidth - 0.5, 0.5)}
          height={barHeight}
          class="fill-accent"
          opacity={Math.max(bar.color / 255, 0.1)}
          rx="0.5"
        />
      {/each}

      {#if trackLength > 0}
        <line x1={posX} y1="0" x2={posX} y2={height} class="stroke-error" stroke-width="2" />
      {/if}
    </svg>
  {:else}
    <div class="flex items-center justify-center rounded-sm bg-base-100 text-[11px] text-base-content/40" style:height="{height}px">
      No waveform data
    </div>
  {/if}
</div>
