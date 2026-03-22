<script lang="ts">
  import { store } from "$lib/stores.svelte.js";
  import { LAYER_NAMES, statusBadgeClass } from "$lib/types.js";
  import type { LayerStatus } from "$lib/types.js";
  import NodeInfoBar from "./NodeInfoBar.svelte";
  import WaveformSvg from "./WaveformSvg.svelte";
  import PacketLog from "./PacketLog.svelte";

  // アクティブ状態(PLAYING/LOOPING)かどうかを判定する
  function isActive(status: LayerStatus): boolean {
    return status === "PLAYING" || status === "LOOPING";
  }

  // BPM値をフォーマットする(100分の1単位の値を変換)
  function formatBPM(bpm: number): string {
    return (bpm / 100).toFixed(2);
  }

  // ミリ秒をMM:SS形式に変換する
  function formatPosition(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  // ミキサーの0-255値をパーセンテージに変換する
  function toPercent(val: number): string {
    return ((val / 255) * 100).toFixed(0);
  }
</script>

<div class="flex flex-col h-full w-full overflow-hidden">
  <NodeInfoBar />

  <div class="flex-1 grid grid-cols-4 grid-rows-2 gap-1.5 p-1.5 overflow-hidden min-h-0">
    {#each store.layers as layer, i}
      {@const active = isActive(layer.status)}
      {@const metrics = store.metrics[i]}
      {@const metadata = store.metadata[i]}
      {@const timeInfo = store.time[i]}
      {@const waveform = store.waveformSmall[i]}
      {@const artworkBase64 = store.artwork[i]}

      <div class="card bg-base-200 border border-base-content/12 overflow-hidden {active ? 'border-accent/50' : ''} {layer.status === 'IDLE' && !metadata && !metrics ? 'opacity-50' : ''}">
        <div class="flex justify-between items-center px-2.5 py-1 bg-base-300 border-b border-base-content/10 flex-shrink-0">
          <span class="text-xs font-bold text-base-content">{LAYER_NAMES[i]}</span>
          <span class="status-badge {statusBadgeClass(layer.status)}">{layer.status}</span>
        </div>

        {#if layer.status !== "IDLE" || metadata || metrics}
          <div class="flex-1 flex flex-col gap-1 px-2 py-1.5 overflow-hidden min-h-0">
            {#if metadata}
              <div class="flex gap-2 items-center flex-shrink-0">
                {#if artworkBase64}
                  <img src="data:image/jpeg;base64,{artworkBase64}" alt="Art" class="w-8 h-8 rounded flex-shrink-0 object-cover" />
                {/if}
                <div class="flex-1 min-w-0">
                  <div class="text-[11px] font-bold text-base-content truncate">{metadata.trackTitle || "Unknown"}</div>
                  <div class="text-[10px] text-base-content/60 truncate">{metadata.trackArtist || "Unknown"}</div>
                </div>
              </div>
            {/if}

            {#if metrics}
              <div class="grid grid-cols-2 gap-x-2 gap-y-0 flex-shrink-0 text-[10px]">
                <div class="flex justify-between"><span class="text-base-content/40">BPM</span><span class="text-accent font-bold text-[11px] tabular-nums">{metrics.bpm != null ? formatBPM(metrics.bpm) : "N/A"}</span></div>
                <div class="flex justify-between"><span class="text-base-content/40">Speed</span><span class="text-base-content tabular-nums">{((metrics.speed ?? 0) / 32768 * 100).toFixed(1)}%</span></div>
                <div class="flex justify-between"><span class="text-base-content/40">Pos</span><span class="text-base-content tabular-nums">{formatPosition(metrics.currentPosition ?? 0)}</span></div>
                <div class="flex justify-between items-center"><span class="text-base-content/40">Beat</span><span class="flex gap-0.5">{#each [1, 2, 3, 4] as b}<span class="w-[5px] h-[5px] rounded-full {metrics.beatMarker === b ? 'bg-accent' : 'bg-base-300'}"></span>{/each}</span></div>
              </div>
            {/if}

            {#if active}
              <WaveformSvg
                bars={waveform}
                currentPosition={timeInfo?.currentTimeMillis ?? 0}
                trackLength={metrics?.trackLength ?? 0}
                height={36}
                class="mx-[-8px] border-none"
              />
            {/if}

            <div class="flex gap-1 mt-auto flex-shrink-0">
              {#if timeInfo}
                <span class="status-badge {timeInfo.onAir === 1 ? 'badge-success' : ''}">{timeInfo.onAir === 1 ? "ON AIR" : "OFF AIR"}</span>
              {/if}
              {#if metrics}
                <span class="status-badge {metrics.syncMaster === 1 ? 'badge-warning' : ''}">{metrics.syncMaster === 1 ? "MASTER" : "SLAVE"}</span>
              {/if}
            </div>
          </div>
        {:else}
          <div class="flex-1 flex items-center justify-center">
            <span class="text-base-content/30 text-[10px] italic">No data</span>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  {#if store.mixer}
    <div class="flex items-center gap-2.5 px-3 py-1 bg-base-300 border-y border-base-content/10 text-[10px] flex-shrink-0">
      <span class="text-base-content/40 font-bold uppercase tracking-wider">Mixer</span>
      <span class="text-base-content/60">Master: {toPercent(store.mixer.masterAudioLevel)}%</span>
      <span class="text-base-content/30">|</span>
      <span class="text-base-content/60">Fader: {toPercent(store.mixer.masterFaderLevel)}%</span>
      <span class="text-base-content/30">|</span>
      <span class="text-base-content/60">XFader: {toPercent(store.mixer.crossFader)}%</span>
      <span class="text-base-content/30">|</span>
      <span class="{store.mixer.beatFxOn ? 'text-success font-bold' : 'text-base-content/60'}">BeatFX: {store.mixer.beatFxOn ? "ON" : "OFF"}</span>
    </div>
  {/if}

  <div class="flex-shrink-0 overflow-hidden" style:height="{store.packetLogHeight}px">
    <PacketLog />
  </div>
</div>
