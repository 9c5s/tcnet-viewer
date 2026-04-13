import { describe, expect, test } from "vite-plus/test";
import {
  calcWindow,
  timeToX,
} from "../../../../src/lib/player-status/waveform-canvas/draw-math.js";

describe("calcWindow", () => {
  test("通常時: currentの左25%にカーソル", () => {
    const w = calcWindow({
      currentMs: 60_000,
      trackLengthMs: 180_000,
      zoomScale: 2,
      canvasWidth: 400,
    });
    expect(w.windowMs).toBe(90_000);
    expect(w.windowLeft).toBe(37_500);
    expect(w.cursorX).toBe(100);
  });
  test("曲頭: windowLeftは0にclamp、カーソルは左端から右へ移動", () => {
    const w = calcWindow({
      currentMs: 20_000,
      trackLengthMs: 360_000,
      zoomScale: 2,
      canvasWidth: 400,
    });
    expect(w.windowLeft).toBe(0);
    expect(w.cursorX).toBeCloseTo((20_000 / 180_000) * 400);
  });
  test("曲末: windowLeftは曲末-windowMsにclamp、カーソルは右側へ", () => {
    const w = calcWindow({
      currentMs: 170_000,
      trackLengthMs: 180_000,
      zoomScale: 2,
      canvasWidth: 400,
    });
    expect(w.windowLeft).toBe(180_000 - 90_000);
    expect(w.cursorX).toBeCloseTo(((170_000 - 90_000) / 90_000) * 400);
  });
  test("zoomScale範囲外はclamp (1-8)", () => {
    const w1 = calcWindow({
      currentMs: 0,
      trackLengthMs: 100_000,
      zoomScale: 0.5,
      canvasWidth: 400,
    });
    expect(w1.windowMs).toBe(100_000);
    const w2 = calcWindow({
      currentMs: 0,
      trackLengthMs: 100_000,
      zoomScale: 10,
      canvasWidth: 400,
    });
    expect(w2.windowMs).toBe(100_000 / 8);
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
