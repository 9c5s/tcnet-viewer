export type WindowParams = {
  currentMs: number;
  trackLengthMs: number;
  zoomScale: number;
  canvasWidth: number;
};

export type WindowResult = {
  windowLeft: number;
  windowMs: number;
  cursorX: number;
};

// zoomScale はステップ index (0-29) として扱い、5 秒 〜 60 秒のウィンドウを
// 対数スケールで均等な 30 段階に分割する。低い秒数で 1 ステップあたりの
// 拡大率が大きくなる線形分割を避け、ステップ間のズーム倍率を一定に保つ
export const ZOOM_MIN = 0;
export const ZOOM_MAX = 29;
// step 8 は stepToWindowMs(8) ≈ 9865ms (表示丸めで 10s) になる
export const ZOOM_DEFAULT = 8;
export const ZOOM_WINDOW_MIN_MS = 5_000;
export const ZOOM_WINDOW_MAX_MS = 60_000;
export const CURSOR_ANCHOR_RATIO = 0.2;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * ステップ index (0-29) を表示窓の秒数 (ms) に変換する。
 * 隣接ステップで windowMs が一定比率で増加する対数スケール。
 */
export function stepToWindowMs(step: number): number {
  const clamped = clamp(step, ZOOM_MIN, ZOOM_MAX);
  const t = (clamped - ZOOM_MIN) / (ZOOM_MAX - ZOOM_MIN);
  return ZOOM_WINDOW_MIN_MS * Math.pow(ZOOM_WINDOW_MAX_MS / ZOOM_WINDOW_MIN_MS, t);
}

/**
 * ズーム波形の表示範囲とカーソルX座標を計算する。
 * windowMs は stepToWindowMs(zoomScale) で導出し、曲の長さに依存しない
 * 一律の表示範囲とする。カーソルは常に canvasWidth * CURSOR_ANCHOR_RATIO
 * に固定し、曲頭・曲末でもスクロールしない。波形は現在位置に追従して左右に
 * 移動し、描画範囲外の領域は呼び出し側で空白として扱う。
 */
export function calcWindow(p: WindowParams): WindowResult {
  if (p.trackLengthMs <= 0) {
    return { windowLeft: 0, windowMs: 0, cursorX: 0 };
  }
  const windowMs = stepToWindowMs(p.zoomScale);
  const current = clamp(p.currentMs, 0, p.trackLengthMs);
  const windowLeft = current - windowMs * CURSOR_ANCHOR_RATIO;
  const cursorX = p.canvasWidth * CURSOR_ANCHOR_RATIO;
  return { windowLeft, windowMs, cursorX };
}

/**
 * 時刻をキャンバス上のX座標に変換する。
 * 画面外でも値を返すので、呼び出し側でクリップ判定する。
 */
export function timeToX(
  timeMs: number,
  windowLeft: number,
  windowMs: number,
  canvasWidth: number,
): number {
  if (windowMs <= 0) return 0;
  return ((timeMs - windowLeft) / windowMs) * canvasWidth;
}
