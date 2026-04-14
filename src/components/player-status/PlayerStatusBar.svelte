<script lang="ts">
  import type { LayerInfo, MetricsData, TimeInfo } from "$lib/types.js";
  import { formatPlayerTime } from "$lib/player-status/time-format.js";
  import { derivePlaybackPosition } from "$lib/player-status/playback-position.js";
  import { isMetricsConsistent } from "$lib/player-status/track-consistency.js";

  interface Props {
    layer: LayerInfo;
    time: TimeInfo | null;
    metrics: MetricsData | null;
  }
  let { layer, time, metrics }: Props = $props();

  let metricsOk = $derived(isMetricsConsistent(layer, metrics));
  let position = $derived(derivePlaybackPosition(time, metricsOk ? metrics : null));
  let onAir = $derived(time?.onAir === 1);
  // 表示用に `MM:SS` と `.FFF` に分割する。プレースホルダはフォーマット結果から直接分割
  function splitTimeParts(placeholder: boolean, ms: number): [string, string] {
    const t = placeholder ? "--:--.---" : formatPlayerTime(ms);
    const dot = t.lastIndexOf(".");
    return [t.slice(0, dot), t.slice(dot)];
  }
  let timeParts = $derived(splitTimeParts(position.placeholder, position.clampedElapsedMs));
  let remainParts = $derived(splitTimeParts(position.placeholder, position.remainMs));
  let bpmText = $derived.by(() => {
    if (!metricsOk || metrics?.bpm === undefined) return "—";
    return (metrics.bpm / 100).toFixed(1);
  });
  // pitchBend は node-tcnet 側で 100 倍スケールの Int16 として読まれている。
  // 既存 MetricsView / CardsLayout と合わせて /100 した % 値に変換する。
  let pitchText = $derived.by(() => {
    if (!metricsOk || metrics?.pitchBend === undefined) return "—";
    const percent = metrics.pitchBend / 100;
    const sign = percent > 0 ? "+" : "";
    return `${sign}${percent.toFixed(2)}%`;
  });
  let isMaster = $derived(metricsOk && metrics?.syncMaster === 1);
  let beatIndex = $derived(
    metricsOk && metrics?.beatMarker !== undefined
      ? Math.min(Math.max((metrics.beatMarker - 1) | 0, 0), 3)
      : -1,
  );
</script>

<div class="grid grid-cols-[auto_1fr_auto_auto] items-center gap-5 border-y border-base-content/20 p-3.5 px-5">
  {#if onAir}
    <div class="rounded-sm border-2 border-error px-3 py-1 font-mono text-[11px] font-bold tracking-widest text-error">
      ON AIR
    </div>
  {:else}
    <div class="
      rounded-sm border-2 border-base-content/40 px-3 py-1 font-mono text-[11px] font-bold tracking-widest
      text-base-content/40
    ">
      OFF AIR
    </div>
  {/if}

  <div class="flex items-baseline gap-6 font-mono">
    <div>
      <span class="block text-[9px] tracking-widest text-base-content/40 uppercase">Time</span>
      <span class="text-[26px] leading-none font-semibold text-white">
        {timeParts[0]}<span class="text-[18px]">{timeParts[1]}</span>
      </span>
    </div>
    <div>
      <span class="block text-[9px] tracking-widest text-base-content/40 uppercase">Remain</span>
      <span class="text-[26px] leading-none font-semibold text-pink">
        {remainParts[0]}<span class="text-[18px]">{remainParts[1]}</span>
      </span>
    </div>
  </div>

  <div class="text-right font-mono">
    <span class="block text-[9px] tracking-widest text-base-content/40 uppercase">Tempo</span>
    <div class="text-[24px] leading-[1.1] font-semibold text-base-content">{bpmText}</div>
    <div class="text-[18px] leading-[1.1] font-semibold text-warning">{pitchText}</div>
  </div>

  <div class="flex flex-col items-end gap-1.5">
    <div class="flex gap-1.5">
      {#if isMaster}
        <span class="rounded-sm bg-orange px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-base-100">MASTER</span>
      {:else}
        <span class="
          rounded-sm border border-base-content/40 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest
          text-base-content/40
        ">MASTER</span>
      {/if}
    </div>
    <div class="flex gap-[3px]">
      {#each [0, 1, 2, 3] as i}
        <div
          class="h-1 w-3.5 rounded-sm"
          class:bg-accent={beatIndex === i}
          class:shadow-[0_0_4px_color-mix(in_oklab,var(--color-success)_50%,transparent)]={beatIndex === i}
          class:bg-base-content={beatIndex !== i}
          class:opacity-20={beatIndex !== i}
        ></div>
      {/each}
    </div>
  </div>
</div>
