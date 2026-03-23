/**
 * ミリ秒をMM:SS.mmm形式に変換する
 */
export function formatMmSs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const millis = ms % 1000;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return (
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0") +
    "." +
    String(millis).padStart(3, "0")
  );
}

/**
 * ミリ秒をMM:SS形式に変換する
 */
export function formatPosition(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/**
 * ミリ秒をHH:MM:SS.mmm形式に変換する
 */
export function formatTimecode(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const millis = ms % 1000;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return (
    String(h).padStart(2, "0") +
    ":" +
    String(m).padStart(2, "0") +
    ":" +
    String(s).padStart(2, "0") +
    "." +
    String(millis).padStart(3, "0")
  );
}

/**
 * BPM生値(100倍整数)を小数2桁の文字列に変換する
 */
export function formatBPM(bpm: number): string {
  return (bpm / 100).toFixed(2);
}
