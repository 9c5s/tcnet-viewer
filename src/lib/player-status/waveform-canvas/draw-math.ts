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

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 32;
export const CURSOR_ANCHOR_RATIO = 0.25;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/**
 * ズーム波形の表示範囲とカーソルX座標を計算する。
 * 通常時はカーソル左25%固定、曲頭・曲末ではwindowLeftをclampする。
 */
export function calcWindow(p: WindowParams): WindowResult {
  if (p.trackLengthMs <= 0) {
    return { windowLeft: 0, windowMs: 0, cursorX: 0 };
  }
  const zoom = clamp(p.zoomScale, ZOOM_MIN, ZOOM_MAX);
  const windowMs = p.trackLengthMs / zoom;
  const anchor = windowMs * CURSOR_ANCHOR_RATIO;
  const current = clamp(p.currentMs, 0, p.trackLengthMs);

  let windowLeft: number;
  if (current < anchor) {
    windowLeft = 0;
  } else if (current > p.trackLengthMs - (windowMs - anchor)) {
    windowLeft = p.trackLengthMs - windowMs;
  } else {
    windowLeft = current - anchor;
  }

  const cursorX = ((current - windowLeft) / windowMs) * p.canvasWidth;
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
