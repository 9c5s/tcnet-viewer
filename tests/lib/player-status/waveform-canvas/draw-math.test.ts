import { describe, expect, test } from "vite-plus/test";
import {
  calcWindow,
  CURSOR_ANCHOR_RATIO,
  timeToX,
  ZOOM_MAX,
  ZOOM_MIN,
} from "../../../../src/lib/player-status/waveform-canvas/draw-math.js";

describe("calcWindow", () => {
  test("通常時: カーソルは canvasWidth の CURSOR_ANCHOR_RATIO 位置で固定", () => {
    const trackLengthMs = 180_000;
    const zoomScale = ZOOM_MIN;
    const windowMs = trackLengthMs / zoomScale;
    const currentMs = 60_000;
    const w = calcWindow({ currentMs, trackLengthMs, zoomScale, canvasWidth: 400 });
    expect(w.windowMs).toBe(windowMs);
    expect(w.windowLeft).toBe(currentMs - windowMs * CURSOR_ANCHOR_RATIO);
    expect(w.cursorX).toBe(400 * CURSOR_ANCHOR_RATIO);
  });
  test("曲頭でもカーソルは固定、windowLeftは負値になる", () => {
    const trackLengthMs = 360_000;
    const zoomScale = ZOOM_MIN;
    const windowMs = trackLengthMs / zoomScale;
    const currentMs = 0;
    const w = calcWindow({ currentMs, trackLengthMs, zoomScale, canvasWidth: 400 });
    // スクロールしないため windowLeft は負値 (波形の左側に空白領域)
    expect(w.windowLeft).toBe(-windowMs * CURSOR_ANCHOR_RATIO);
    expect(w.cursorX).toBe(400 * CURSOR_ANCHOR_RATIO);
  });
  test("曲末でもカーソルは固定、windowLeftはtrackLengthMsを超えうる", () => {
    const trackLengthMs = 180_000;
    const zoomScale = ZOOM_MIN;
    const windowMs = trackLengthMs / zoomScale;
    const currentMs = trackLengthMs;
    const w = calcWindow({ currentMs, trackLengthMs, zoomScale, canvasWidth: 400 });
    // 曲末でもスクロールしないため windowLeft が trackLengthMs - windowMs を超えうる
    expect(w.windowLeft).toBe(trackLengthMs - windowMs * CURSOR_ANCHOR_RATIO);
    expect(w.cursorX).toBe(400 * CURSOR_ANCHOR_RATIO);
  });
  test("zoomScale範囲外はZOOM_MIN-ZOOM_MAXにclamp", () => {
    const w1 = calcWindow({
      currentMs: 0,
      trackLengthMs: 100_000,
      zoomScale: 0.5,
      canvasWidth: 400,
    });
    expect(w1.windowMs).toBe(100_000 / ZOOM_MIN);
    const w2 = calcWindow({
      currentMs: 0,
      trackLengthMs: 100_000,
      zoomScale: ZOOM_MAX * 2,
      canvasWidth: 400,
    });
    expect(w2.windowMs).toBe(100_000 / ZOOM_MAX);
  });
  test("trackLength=0はwindowMs=0、cursorX=0", () => {
    const w = calcWindow({ currentMs: 0, trackLengthMs: 0, zoomScale: 2, canvasWidth: 400 });
    expect(w.windowMs).toBe(0);
    expect(w.cursorX).toBe(0);
  });
});

describe("timeToX", () => {
  test("windowLeftに一致する時刻はx=0", () => {
    expect(timeToX(37_500, 37_500, 90_000, 400)).toBe(0);
  });
  test("windowRightに一致する時刻はx=canvasWidth", () => {
    expect(timeToX(127_500, 37_500, 90_000, 400)).toBe(400);
  });
  test("windowMs=0は常にx=0", () => {
    expect(timeToX(100, 0, 0, 400)).toBe(0);
  });
});
