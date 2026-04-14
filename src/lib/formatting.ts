/**
 * ミリ秒をMM:SS.mmm形式に変換する
 */
export function formatMmSs(ms: number): string {
  ms = Math.max(0, ms);
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
  ms = Math.max(0, ms);
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/**
 * ミリ秒をHH:MM:SS.mmm形式に変換する
 */
export function formatTimecode(ms: number): string {
  ms = Math.max(0, ms);
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
  bpm = Math.max(0, bpm);
  return (bpm / 100).toFixed(2);
}

// TCNetプロトコル仕様でのSpeed値の100%基準値 (2の20乗)
// Speedフィールドは固定小数点整数で送信され、1048576が再生速度100%を表す
const SPEED_SCALE = 1_048_576;

/**
 * TCNet Speed値を「NN.NN%」形式の文字列に変換する
 * 生値は固定小数点整数で、SPEED_SCALE (2^20) が100%に相当する
 */
export function formatSpeedPercent(speed: number): string {
  return ((speed / SPEED_SCALE) * 100).toFixed(2) + "%";
}

/**
 * 数値を指定幅のゼロ埋め16進数文字列に変換する
 */
export function formatHex(value: number, width: number): string {
  return value.toString(16).padStart(width, "0");
}

/**
 * CuePoint.type から表示ラベルを生成する。
 * 実機 (Pioneer CDJ + Bridge) では type=0 が Memory Cue、type=1-8 が
 * Hot Cue A-H に1対1で対応する。
 */
export function cueLabel(type: number): string {
  if (type === 0) return "Memory";
  if (type >= 1 && type <= 8) return `Hot ${String.fromCharCode(64 + type)}`;
  return `T${type}`;
}
