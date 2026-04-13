import { describe, expect, test } from "vite-plus/test";
import {
  isMetadataConsistent,
  isMetricsConsistent,
} from "../../../src/lib/player-status/track-consistency.js";
import type { LayerInfo, MetadataData, MetricsData } from "../../../src/lib/types.js";

const layer = (trackID: number): LayerInfo => ({
  source: 0,
  status: "PLAYING",
  trackID,
  name: "L1",
});
const md = (trackID: number) =>
  ({ trackArtist: "a", trackTitle: "t", trackKey: 0, trackID }) as unknown as MetadataData;
const mt = (trackID: number) =>
  ({
    state: 3,
    syncMaster: 0,
    beatMarker: 1,
    trackLength: 1,
    currentPosition: 0,
    speed: 0,
    beatNumber: 0,
    bpm: 0,
    pitchBend: 0,
    trackID,
  }) as unknown as MetricsData;

describe("isMetadataConsistent", () => {
  test("trackID一致でtrue", () => {
    expect(isMetadataConsistent(layer(42), md(42))).toBe(true);
  });
  test("trackID不一致でfalse", () => {
    expect(isMetadataConsistent(layer(42), md(43))).toBe(false);
  });
  test("metadata=nullでfalse", () => {
    expect(isMetadataConsistent(layer(42), null)).toBe(false);
  });
  test("layers.trackID=0 (IDLE) でもmetadataと一致すればtrue (placeholder側で別途IDLE除外)", () => {
    expect(isMetadataConsistent(layer(0), md(0))).toBe(true);
  });
});

describe("isMetricsConsistent", () => {
  test("trackID一致でtrue", () => {
    expect(isMetricsConsistent(layer(42), mt(42))).toBe(true);
  });
  test("trackID不一致でfalse", () => {
    expect(isMetricsConsistent(layer(42), mt(43))).toBe(false);
  });
  test("metrics=nullでfalse", () => {
    expect(isMetricsConsistent(layer(42), null)).toBe(false);
  });
});
