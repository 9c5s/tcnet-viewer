import type { MetricsData, TimeInfo } from "../types.js";

export type PlaybackPosition = {
  placeholder: boolean;
  elapsedMs: number;
  clampedElapsedMs: number;
  trackLengthMs: number;
  remainMs: number;
};

const PLACEHOLDER: PlaybackPosition = {
  placeholder: true,
  elapsedMs: 0,
  clampedElapsedMs: 0,
  trackLengthMs: 0,
  remainMs: 0,
};

/**
 * 再生位置コントラクトに従って、時刻依存UIの値を導出する。
 * SSoTは time.currentTimeMillis。metrics.currentPositionは使わない。
 * MetricsData はすべて optional のため、undefined は placeholder として扱う。
 */
export function derivePlaybackPosition(
  time: TimeInfo | null,
  metrics: MetricsData | null,
): PlaybackPosition {
  if (!time || !metrics) return PLACEHOLDER;
  const trackLengthMs = metrics.trackLength;
  if (trackLengthMs === undefined || !Number.isFinite(trackLengthMs) || trackLengthMs <= 0) {
    return PLACEHOLDER;
  }

  const elapsedMs = time.currentTimeMillis ?? 0;
  const clampedElapsedMs = Math.min(Math.max(elapsedMs, 0), trackLengthMs);
  const remainMs = trackLengthMs - clampedElapsedMs;

  return {
    placeholder: false,
    elapsedMs,
    clampedElapsedMs,
    trackLengthMs,
    remainMs,
  };
}
