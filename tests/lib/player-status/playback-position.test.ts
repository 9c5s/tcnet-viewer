import { describe, expect, test } from "vite-plus/test";
import { derivePlaybackPosition } from "../../../src/lib/player-status/playback-position.js";
import type { TimeInfo } from "../../../src/lib/types.js";
import type { MetricsData } from "../../../src/lib/types.js";

function time(currentTimeMillis: number, onAir = 1): TimeInfo {
  return {
    type: 0,
    currentTimeMillis,
    totalTimeMillis: 0,
    remainingTimeMillis: 0,
    onAir,
  } as unknown as TimeInfo;
}
function metrics(trackLength: number, trackID = 1): MetricsData {
  return {
    state: 3,
    syncMaster: 0,
    beatMarker: 1,
    trackLength,
    currentPosition: 0,
    speed: 0,
    beatNumber: 0,
    bpm: 12000,
    pitchBend: 0,
    trackID,
  };
}
// sparse metrics: optional フィールドが欠けている現実的なパケット想定
const sparseMetrics: MetricsData = { trackID: 1 };

describe("derivePlaybackPosition", () => {
  test("metrics.trackLength=undefinedはplaceholder", () => {
    const r = derivePlaybackPosition(time(30_000), sparseMetrics);
    expect(r.placeholder).toBe(true);
  });

  test("time/metrics揃った通常ケース", () => {
    const r = derivePlaybackPosition(time(30_000), metrics(180_000));
    expect(r.placeholder).toBe(false);
    expect(r.elapsedMs).toBe(30_000);
    expect(r.clampedElapsedMs).toBe(30_000);
    expect(r.trackLengthMs).toBe(180_000);
    expect(r.remainMs).toBe(150_000);
  });
  test("elapsedがtrackLengthを超過した場合はclamp", () => {
    const r = derivePlaybackPosition(time(200_000), metrics(180_000));
    expect(r.clampedElapsedMs).toBe(180_000);
    expect(r.remainMs).toBe(0);
  });
  test("負のelapsedは0にclamp", () => {
    const r = derivePlaybackPosition(time(-1000), metrics(180_000));
    expect(r.clampedElapsedMs).toBe(0);
    expect(r.remainMs).toBe(180_000);
  });
  test("time=nullはplaceholder", () => {
    const r = derivePlaybackPosition(null, metrics(180_000));
    expect(r.placeholder).toBe(true);
  });
  test("metrics=nullはplaceholder", () => {
    const r = derivePlaybackPosition(time(30_000), null);
    expect(r.placeholder).toBe(true);
  });
  test("trackLength=0はplaceholder", () => {
    const r = derivePlaybackPosition(time(30_000), metrics(0));
    expect(r.placeholder).toBe(true);
  });
  test("remainは常に非負", () => {
    const r = derivePlaybackPosition(time(999_999), metrics(1000));
    expect(r.remainMs).toBeGreaterThanOrEqual(0);
  });
});
