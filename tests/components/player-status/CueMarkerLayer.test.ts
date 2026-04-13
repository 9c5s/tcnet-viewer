// @vitest-environment jsdom
import { describe, expect, test } from "vite-plus/test";
import { render } from "@testing-library/svelte";
import CueMarkerLayer from "../../../src/components/player-status/CueMarkerLayer.svelte";
import type { CuePoint } from "../../../src/lib/types.js";

const cue = (over: Partial<CuePoint> = {}): CuePoint => ({
  index: 0,
  type: 0,
  inTime: 60_000,
  outTime: 0,
  color: { r: 122, g: 162, b: 247 },
  ...over,
});

describe("CueMarkerLayer", () => {
  test("hot cue は rgb 色の四角で描画される", () => {
    const { container } = render(CueMarkerLayer, {
      props: { cues: [cue({ type: 0 })], trackLengthMs: 180_000 },
    });
    const box = container.querySelector('[style*="background-color"]') as HTMLElement;
    expect(box).toBeTruthy();
    expect(box.getAttribute("style")).toContain("rgb(122, 162, 247)");
  });
  test("memory cue は赤逆三角 (border-top: error色)", () => {
    const { container } = render(CueMarkerLayer, {
      props: { cues: [cue({ type: 1 })], trackLengthMs: 180_000 },
    });
    const tri = container.querySelector('[style*="border-top"]') as HTMLElement;
    expect(tri).toBeTruthy();
    expect(tri.getAttribute("style")).toMatch(/border-top:\s*8px\s+solid\s+var\(--color-error\)/);
  });
  test("trackLengthMs=0 は描画しない", () => {
    const { container } = render(CueMarkerLayer, {
      props: { cues: [cue()], trackLengthMs: 0 },
    });
    expect(container.querySelector('[style*="background-color"]')).toBeNull();
  });
  test("windowMs 指定時は範囲外 cue を描画しない", () => {
    const { container } = render(CueMarkerLayer, {
      props: {
        cues: [cue({ inTime: 30_000 }), cue({ inTime: 150_000 })],
        trackLengthMs: 180_000,
        windowLeftMs: 0,
        windowMs: 60_000,
      },
    });
    const boxes = container.querySelectorAll('[style*="background-color"]');
    expect(boxes.length).toBe(1);
  });
});
