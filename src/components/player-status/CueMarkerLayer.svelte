<script lang="ts">
  import type { CuePoint } from "$lib/types.js";

  interface Props {
    cues: CuePoint[] | null;
    trackLengthMs: number;
    windowLeftMs?: number;
    windowMs?: number;
    class?: string;
  }
  let {
    cues,
    trackLengthMs,
    windowLeftMs = 0,
    windowMs,
    class: className = "",
  }: Props = $props();

  // windowMs未指定時は全曲表示 (フル波形用)
  let effectiveWindowMs = $derived(windowMs ?? trackLengthMs);
  let effectiveWindowLeft = $derived(windowMs == null ? 0 : windowLeftMs);

  function leftPercent(timeMs: number): number | null {
    if (effectiveWindowMs <= 0) return null;
    const pct = ((timeMs - effectiveWindowLeft) / effectiveWindowMs) * 100;
    if (pct < 0 || pct > 100) return null;
    return pct;
  }

  // CuePoint.type の値: 0=HotCue, 1=MemoryCue (server/parsers/cue-data.ts 参照)
  const TYPE_HOT_CUE = 0;
  const TYPE_MEMORY_CUE = 1;
</script>

<div class="relative h-2.5 {className}">
  {#if cues && cues.length > 0 && trackLengthMs > 0}
    {#each cues as cue}
      {@const pct = leftPercent(cue.inTime)}
      {#if pct !== null}
        {#if cue.type === TYPE_MEMORY_CUE}
          <div
            class="absolute top-0 size-0"
            style:left="{pct}%"
            style:transform="translateX(-50%)"
            style:border-left="5px solid transparent"
            style:border-right="5px solid transparent"
            style:border-top="8px solid var(--color-error)"
          ></div>
        {:else if cue.type === TYPE_HOT_CUE}
          <div
            class="absolute top-0 size-2"
            style:left="{pct}%"
            style:transform="translateX(-50%)"
            style:background-color="rgb({cue.color.r}, {cue.color.g}, {cue.color.b})"
          ></div>
        {/if}
      {/if}
    {/each}
  {/if}
</div>
