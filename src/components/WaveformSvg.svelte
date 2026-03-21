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
</script>

<div class="px-2 py-1 border-b border-base-content/20 {className}">
  <svg
    viewBox="0 0 {VIEW_WIDTH} {height}"
    preserveAspectRatio="none"
    class="w-full rounded block"
    style:height="{height}px"
  >
    <rect width={VIEW_WIDTH} height={height} class="fill-base-100" />

    {#if bars && bars.length > 0}
      {@const barWidth = VIEW_WIDTH / bars.length}
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
        {@const posX = (currentPosition / trackLength) * VIEW_WIDTH}
        <line x1={posX} y1="0" x2={posX} y2={height} class="stroke-accent" stroke-width="2" />
      {/if}
    {:else}
      <text
        x={VIEW_WIDTH / 2}
        y={height / 2}
        text-anchor="middle"
        dominant-baseline="middle"
        class="fill-base-content/40 text-[11px]"
      >
        No waveform data
      </text>
    {/if}
  </svg>
</div>
