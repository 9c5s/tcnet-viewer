import { describe, expect, test } from "vite-plus/test";
import {
  calcWindow,
  CURSOR_ANCHOR_RATIO,
  stepToWindowMs,
  timeToX,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_WINDOW_MAX_MS,
  ZOOM_WINDOW_MIN_MS,
} from "../../../../src/lib/player-status/waveform-canvas/draw-math.js";

describe("stepToWindowMs", () => {
  test("ZOOM_MIN は ZOOM_WINDOW_MIN_MS を返す", () => {
    expect(stepToWindowMs(ZOOM_MIN)).toBe(ZOOM_WINDOW_MIN_MS);
  });
  test("ZOOM_MAX は ZOOM_WINDOW_MAX_MS を返す", () => {
    expect(stepToWindowMs(ZOOM_MAX)).toBeCloseTo(ZOOM_WINDOW_MAX_MS);
  });
  test("対数スケールで隣接ステップは一定比率で増加する", () => {
    const ratio = stepToWindowMs(1) / stepToWindowMs(0);
    const ratioMid = stepToWindowMs(ZOOM_MAX) / stepToWindowMs(ZOOM_MAX - 1);
    // 全ステップで同じ比率になる (対数スケールの定義)
    expect(ratioMid).toBeCloseTo(ratio);
  });
  test("ZOOM_MIN/ZOOM_MAX 範囲外は clamp する", () => {
    expect(stepToWindowMs(-10)).toBe(ZOOM_WINDOW_MIN_MS);
    expect(stepToWindowMs(ZOOM_MAX + 100)).toBeCloseTo(ZOOM_WINDOW_MAX_MS);
  });
});

describe("calcWindow", () => {
  test("windowMs は stepToWindowMs(zoomScale) と一致 (trackLength非依存)", () => {
    const zoomScale = ZOOM_MIN;
    const expectedWindowMs = stepToWindowMs(zoomScale);
    const w1 = calcWindow({
      currentMs: 60_000,
      trackLengthMs: 180_000,
      zoomScale,
      canvasWidth: 400,
    });
    const w2 = calcWindow({
      currentMs: 60_000,
      trackLengthMs: 360_000,
      zoomScale,
      canvasWidth: 400,
    });
    expect(w1.windowMs).toBe(expectedWindowMs);
    expect(w2.windowMs).toBe(expectedWindowMs);
  });
  test("通常時: カーソルは canvasWidth の CURSOR_ANCHOR_RATIO 位置で固定", () => {
    const trackLengthMs = 180_000;
    const zoomScale = ZOOM_MIN;
    const windowMs = stepToWindowMs(zoomScale);
    const currentMs = 60_000;
    const w = calcWindow({ currentMs, trackLengthMs, zoomScale, canvasWidth: 400 });
    expect(w.windowMs).toBe(windowMs);
    expect(w.windowLeft).toBe(currentMs - windowMs * CURSOR_ANCHOR_RATIO);
    expect(w.cursorX).toBe(400 * CURSOR_ANCHOR_RATIO);
  });
  test("曲頭でもカーソルは固定、windowLeftは負値になる", () => {
    const trackLengthMs = 360_000;
    const zoomScale = ZOOM_MIN;
    const windowMs = stepToWindowMs(zoomScale);
    const currentMs = 0;
    const w = calcWindow({ currentMs, trackLengthMs, zoomScale, canvasWidth: 400 });
    expect(w.windowLeft).toBe(-windowMs * CURSOR_ANCHOR_RATIO);
    expect(w.cursorX).toBe(400 * CURSOR_ANCHOR_RATIO);
  });
  test("曲末でもカーソルは固定、windowLeftはtrackLengthMsを超えうる", () => {
    const trackLengthMs = 180_000;
    const zoomScale = ZOOM_MIN;
    const windowMs = stepToWindowMs(zoomScale);
    const currentMs = trackLengthMs;
    const w = calcWindow({ currentMs, trackLengthMs, zoomScale, canvasWidth: 400 });
    expect(w.windowLeft).toBe(trackLengthMs - windowMs * CURSOR_ANCHOR_RATIO);
    expect(w.cursorX).toBe(400 * CURSOR_ANCHOR_RATIO);
  });
  test("trackLength=0はwindowMs=0、cursorX=0", () => {
    const w = calcWindow({
      currentMs: 0,
      trackLengthMs: 0,
      zoomScale: ZOOM_MIN,
      canvasWidth: 400,
    });
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
