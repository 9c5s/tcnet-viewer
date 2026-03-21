<script lang="ts">
  import { store } from "$lib/stores.svelte.js";

  interface Props {
    layer: number;
  }
  let { layer }: Props = $props();

  let cues = $derived(store.cues[layer]);

  // ミリ秒をMM:SS.mmm形式に変換する
  function formatMmSs(ms: number): string {
    if (ms <= 0) return "--:--.---";
    const totalSec = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return (
      String(m).padStart(2, "0") +
      ":" +
      String(s).padStart(2, "0") +
      "." +
      String(millis).padStart(3, "0")
    );
  }

  // CUEタイプ名を返す
  function cueTypeName(type: number): string {
    switch (type) {
      case 0: return "CUE";
      case 1: return "IN";
      case 2: return "OUT";
      case 3: return "LOOP";
      default: return `T${type}`;
    }
  }
</script>

<div class="p-3">
  <h3 class="text-[10px] text-base-content/40 uppercase tracking-wider mb-2">Cue Points</h3>
  {#if cues && cues.length > 0}
    <table class="table table-xs">
      <tbody>
        {#each cues as cue}
          <tr>
            <td class="w-4 px-0">
              <span class="inline-block w-2.5 h-2.5 rounded-full" style="background: rgb({cue.color.r}, {cue.color.g}, {cue.color.b})"></span>
            </td>
            <td class="text-base-content/70 px-1">#{cue.index}</td>
            <td class="text-base-content/70 px-1">{cueTypeName(cue.type)}</td>
            <td class="text-base-content" style="font-variant-numeric: tabular-nums">{formatMmSs(cue.inTime)}</td>
            {#if cue.outTime > 0}
              <td class="text-base-content/40" style="font-variant-numeric: tabular-nums">- {formatMmSs(cue.outTime)}</td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="text-base-content/40 text-[11px]">No cue points</div>
  {/if}
</div>
