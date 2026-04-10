<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, statusBadgeClass } from "$lib/types.js";
  import type { LayerStatus } from "$lib/types.js";
  import { formatBPM, formatPosition } from "$lib/formatting.js";
  import NodeInfoBar from "./NodeInfoBar.svelte";
  import WaveformSvg from "./WaveformSvg.svelte";
  import PacketLog from "./PacketLog.svelte";

  // アクティブ状態(PLAYING/LOOPING)かどうかを判定する
  function isActive(status: LayerStatus): boolean {
    return status === "PLAYING" || status === "LOOPING";
  }

  // レイヤーがidle(トラック未ロード)かどうかを判定する
  function isIdle(i: number): boolean {
    return store.layers[i].status === "IDLE" && store.layers[i].trackID === 0;
  }

  // ミキサーの0-255値をパーセンテージに変換する
  function toPercent(val: number): string {
    return ((val / 255) * 100).toFixed(0);
  }

  // 表示対象のレイヤーインデックスを算出する
  const visibleIndices = $derived(
    store.hideIdleLayers
      ? store.layers.map((_, i) => i).filter((i) => !isIdle(i))
      : store.layers.map((_, i) => i),
  );

  // 表示枚数に応じた列数を算出する
  function gridCols(count: number): number {
    if (count <= 2) return count;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  }
</script>

<div class="flex size-full flex-col overflow-hidden">
  <NodeInfoBar />

  <div
    class="grid min-h-0 flex-1 content-start gap-1.5 overflow-auto p-1.5"
    style:grid-template-columns="repeat({gridCols(visibleIndices.length)}, 1fr)"
  >
    {#each visibleIndices as i (i)}
      {@const layer = store.layers[i]}
      {@const active = isActive(layer.status)}
      {@const metrics = store.metrics[i]}
      {@const metadata = store.metadata[i]}
      {@const timeInfo = store.time[i]}
      {@const waveform = store.waveformSmall[i]}
      {@const artwork = store.artwork[i]}

      <div
        class="card overflow-hidden border border-base-content/12 bg-base-200 {active ? 'border-accent/50' : ''}"
        class:opacity-50={layer.status === 'IDLE' && !metadata && !metrics}
      >
        <div class="flex shrink-0 items-center justify-between border-b border-base-content/10 bg-base-300 px-2.5 py-1">
          <span class="text-xs font-bold text-base-content">{LAYER_NAMES[i]}</span>
          <span class="status-badge {statusBadgeClass(layer.status)}">{layer.status}</span>
        </div>

        {#if layer.status !== "IDLE" || metadata || metrics}
          <div class="flex min-h-0 flex-1 flex-col gap-1 overflow-hidden px-2 py-1.5">
            {#if metadata}
              <div class="flex shrink-0 items-center gap-2">
                {#if artwork}
                  <img src="data:{artwork.mimeType};base64,{artwork.base64}" alt="Art"
                    onerror={() => { store.artwork[i] = null; }}
                    class="size-8 shrink-0 rounded-sm object-cover" />
                {/if}
                <div class="min-w-0 flex-1">
                  <div class="text-[11px] leading-tight font-bold text-base-content">{metadata.trackTitle || "Unknown"}</div>
                  <div class="truncate text-[10px] text-base-content/60">{metadata.trackArtist || "Unknown"}</div>
                </div>
              </div>
            {/if}

            {#if metrics}
              <div class="grid shrink-0 grid-cols-2 gap-x-2 gap-y-0 text-[10px]">
                <div class="flex justify-between"><span class="text-base-content/40">BPM</span><span class="
                  text-[11px] font-bold text-accent tabular-nums
                ">{metrics.bpm != null ? formatBPM(metrics.bpm) : "N/A"}</span></div>
                <div class="flex justify-between"><span class="text-base-content/40">Pitch</span><span class="
                  text-base-content tabular-nums
                ">{metrics.pitchBend != null ? ((metrics.pitchBend) / 100).toFixed(2) + "%" : "-"}</span></div>
                <div class="flex justify-between"><span class="text-base-content/40">Pos</span><span class="
                  text-base-content tabular-nums
                ">{metrics.currentPosition != null ? formatPosition(metrics.currentPosition) : "-"}</span></div>
                <div class="flex items-center justify-between"><span class="text-base-content/40">Beat</span><span class="
                  flex gap-0.5
                ">{#each [1, 2, 3, 4] as b}<span class="size-[5px] rounded-full" class:bg-accent={metrics.beatMarker === b} class:bg-base-300={metrics.beatMarker !== b}></span>{/each}</span></div>
              </div>
            {/if}

            {#if waveform}
              <WaveformSvg
                bars={waveform}
                currentPosition={timeInfo?.currentTimeMillis ?? 0}
                trackLength={metrics?.trackLength ?? 0}
                height={36}
                class="mx-[-8px] border-none"
              />
            {/if}

            <div class="mt-auto flex shrink-0 gap-1">
              {#if timeInfo}
                <span class="status-badge" class:badge-success={timeInfo.onAir === 1}>{timeInfo.onAir === 1 ? "ON AIR" : "OFF AIR"}</span>
              {/if}
              {#if metrics?.syncMaster != null}
                <span class="status-badge" class:badge-warning={metrics.syncMaster === 1}>{metrics.syncMaster === 1 ? "MASTER" : "SLAVE"}</span>
              {/if}
            </div>
          </div>
        {:else}
          <div class="flex flex-1 items-center justify-center">
            <span class="text-[10px] text-base-content/30 italic">No data</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  {#if store.mixer}
    <div class="flex shrink-0 items-center gap-2.5 border-y border-base-content/10 bg-base-300 px-3 py-1 text-[10px]">
      <span class="font-bold tracking-wider text-base-content/40 uppercase">Mixer</span>
      <span class="text-base-content/60">Master: {toPercent(store.mixer.masterAudioLevel)}%</span>
      <span class="text-base-content/30">|</span>
      <span class="text-base-content/60">Fader: {toPercent(store.mixer.masterFaderLevel)}%</span>
      <span class="text-base-content/30">|</span>
      <span class="text-base-content/60">XFader: {toPercent(store.mixer.crossFader)}%</span>
      <span class="text-base-content/30">|</span>
      <span class="{store.mixer.beatFxOn ? 'font-bold text-success' : 'text-base-content/60'}">BeatFX: {store.mixer.beatFxOn ? "ON" : "OFF"}</span>
    </div>
  {/if}

  <div class="shrink-0 overflow-hidden" style:height="{store.packetLogHeight}px">
    <PacketLog />
  </div>
</div>
