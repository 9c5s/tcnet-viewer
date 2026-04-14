<script lang="ts">
  import type { BeatGridEntry, CuePoint, WaveformBar } from "$lib/types.js";
  import {
    calcWindow,
    stepToWindowMs,
    timeToX,
    ZOOM_MAX,
    ZOOM_MIN,
  } from "$lib/player-status/waveform-canvas/draw-math.js";
  import { themeColor, themeRgba } from "$lib/player-status/theme-color.js";
  import CueMarkerLayer from "./CueMarkerLayer.svelte";

  interface Props {
    bars: WaveformBar[] | null;
    cues: CuePoint[] | null;
    beatgrid: BeatGridEntry[] | null;
    currentTimeMs: number;
    trackLengthMs: number;
    zoomScale: number;
    onZoomChange: (v: number) => void;
    height?: number;
  }
  let {
    bars, cues, beatgrid, currentTimeMs, trackLengthMs, zoomScale, onZoomChange,
    height = 80,
  }: Props = $props();

  // Svelte 5 の bind:this は $state でないと reactive にならない
  let canvasEl = $state<HTMLCanvasElement | undefined>(undefined);
  let canvasWidth = $state(800);
  let win = $derived(calcWindow({ currentMs: currentTimeMs, trackLengthMs, zoomScale, canvasWidth }));

  function draw() {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasWidth, height);

    if (!bars || bars.length === 0 || trackLengthMs <= 0) return;

    const barDurationMs = trackLengthMs / bars.length;
    const { windowLeft, windowMs } = win;
    if (windowMs <= 0) return;

    // 波形コントラスト強調用の暗面。Tokyo-Nightの最暗背景(base-300)を半透明で重ねる
    ctx.fillStyle = themeRgba("base-300", 0.5);
    ctx.fillRect(0, 0, canvasWidth, height);

    const waveformColor = themeColor("accent");
    const firstIdx = Math.max(0, Math.floor(windowLeft / barDurationMs));
    const lastIdx = Math.min(bars.length - 1, Math.ceil((windowLeft + windowMs) / barDurationMs));
    for (let i = firstIdx; i <= lastIdx; i++) {
      const bar = bars[i]!;
      const barStartMs = i * barDurationMs;
      const x = timeToX(barStartMs, windowLeft, windowMs, canvasWidth);
      const w = Math.max((barDurationMs / windowMs) * canvasWidth, 1);
      const level = (bar.level / 255) * height;
      ctx.globalAlpha = Math.max(bar.color / 255, 0.1);
      ctx.fillStyle = waveformColor;
      ctx.fillRect(x, height - level, w, level);
    }
    ctx.globalAlpha = 1;

    if (beatgrid && beatgrid.length > 0) {
      const downbeatColor = themeRgba("error", 0.6);
      const beatColor = themeRgba("primary-content", 0.25);
      for (const b of beatgrid) {
        if (b.timestampMs < windowLeft || b.timestampMs > windowLeft + windowMs) continue;
        const x = timeToX(b.timestampMs, windowLeft, windowMs, canvasWidth);
        if (b.beatType === 1) {
          ctx.strokeStyle = downbeatColor;
          ctx.lineWidth = 1.5;
        } else {
          ctx.strokeStyle = beatColor;
          ctx.lineWidth = 1;
        }
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = themeColor("error");
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(win.cursorX, 0);
    ctx.lineTo(win.cursorX, height);
    ctx.stroke();
  }

  $effect(() => {
    if (!canvasEl) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        canvasWidth = e.contentRect.width;
        canvasEl!.width = canvasWidth * window.devicePixelRatio;
        canvasEl!.height = height * window.devicePixelRatio;
        const ctx = canvasEl!.getContext("2d");
        ctx?.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      }
    });
    ro.observe(canvasEl);
    return () => ro.disconnect();
  });

  // props 変更に追従して描画する。Svelte のリアクティビティにより
  // 依存値 (bars/cues/beatgrid/zoomScale/trackLengthMs/currentTimeMs/canvasWidth)
  // のいずれかが変わったときに再実行される。
  // 再生中の currentTimeMs は time パケット到着 (約 30Hz) ごとに更新されるため、
  // RAF ループで毎フレーム再描画するより CPU コストが低い
  $effect(() => {
    void bars;
    void cues;
    void beatgrid;
    void zoomScale;
    void trackLengthMs;
    void currentTimeMs;
    void canvasWidth;
    draw();
  });
</script>

<div class="px-5 pb-3">
  <div class="mb-1 flex items-center justify-between gap-4">
    <span class="text-[9px] tracking-widest text-base-content/40 uppercase">Zoom</span>
    <div class="flex items-center gap-2 font-mono">
      <span class="text-[9px] tracking-widest text-base-content/40 uppercase">Scale</span>
      <input
        type="range"
        min={ZOOM_MIN}
        max={ZOOM_MAX}
        step="1"
        value={zoomScale}
        oninput={(e) => onZoomChange(Number(e.currentTarget.value))}
        onpointerdown={(e) => e.stopPropagation()}
        ontouchstart={(e) => e.stopPropagation()}
        class="range w-36 range-primary range-xs"
      />
      <span class="w-10 text-right text-[11px] text-base-content"
        >{Math.round(stepToWindowMs(zoomScale) / 1000)}s</span
      >
    </div>
  </div>

  <CueMarkerLayer
    {cues}
    {trackLengthMs}
    windowLeftMs={win.windowLeft}
    windowMs={win.windowMs}
  />

  {#if bars && bars.length > 0 && trackLengthMs > 0}
    <canvas bind:this={canvasEl} class="block w-full rounded-sm" style:height="{height}px"></canvas>
  {:else}
    <div class="flex items-center justify-center rounded-sm bg-base-100 text-[11px] text-base-content/40" style:height="{height}px">
      No waveform data
    </div>
  {/if}
</div>
