<script lang="ts">
  import type { WaveformBar } from "$lib/types.js";

  interface Props {
    bars: WaveformBar[] | null;
    currentPosition: number;
    trackLength: number;
  }
  let { bars, currentPosition, trackLength }: Props = $props();

  // oxlint-disable-next-line no-unassigned-vars -- Svelteのbind:thisで代入される
  let canvas: HTMLCanvasElement;

  // 波形とプレイヘッドをCanvasに描画する
  function draw(): void {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvasサイズを要素サイズに合わせる
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // 背景クリア
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, w, h);

    if (!bars || bars.length === 0) {
      // 波形データがない場合
      ctx.fillStyle = "#484f58";
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No waveform data", w / 2, h / 2);
      return;
    }

    // 波形バーを描画する
    const barWidth = w / bars.length;
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];
      const barHeight = (bar.level / 255) * h;
      const x = i * barWidth;
      const y = h - barHeight;

      // 青系のグラデーション: colorが高いほど明るい
      const r = Math.min(bar.color, 100);
      const g = Math.min(bar.color, 150);
      const b = Math.max(bar.color, 150);
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, Math.max(barWidth - 0.5, 0.5), barHeight);
    }

    // 現在位置のプレイヘッド描画
    if (trackLength > 0) {
      const posX = (currentPosition / trackLength) * w;
      ctx.strokeStyle = "#58a6ff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(posX, 0);
      ctx.lineTo(posX, h);
      ctx.stroke();
    }
  }

  $effect(() => {
    // bars, currentPosition, trackLengthの変更を追跡して再描画する
    void bars;
    void currentPosition;
    void trackLength;
    draw();
  });
</script>

<div class="waveform-wrapper">
  <canvas bind:this={canvas} class="waveform-canvas"></canvas>
</div>

<style>
  .waveform-wrapper {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .waveform-canvas {
    width: 100%;
    height: 80px;
    border-radius: 4px;
    display: block;
  }
</style>
