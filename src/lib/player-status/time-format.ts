/**
 * ミリ秒をMM:SS:FF.F形式に変換する
 * - 1フレーム = 1/75秒
 * - フレーム小数は 0 または 5 (0.5フレーム刻み)
 * - 100分以上は分の桁を3桁ゼロ埋め
 * - 負値・非数値・Infinityはプレースホルダを返す
 */
export function formatPlayerTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "--:--:--.-";

  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const totalFrames = (ms % 1000) / (1000 / 75);
  const ff = Math.floor(totalFrames);
  const fHalf = totalFrames - ff >= 0.5 ? 5 : 0;

  const mPad = m >= 100 ? String(m).padStart(3, "0") : String(m).padStart(2, "0");
  return `${mPad}:${String(s).padStart(2, "0")}:${String(ff).padStart(2, "0")}.${fHalf}`;
}
