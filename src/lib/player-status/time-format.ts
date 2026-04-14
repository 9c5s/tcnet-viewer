/**
 * ミリ秒をMM:SS.FFF形式に変換する
 * - 秒以下はミリ秒3桁で表示する
 * - 100分以上は分の桁を3桁ゼロ埋め
 * - 負値・非数値・Infinityはプレースホルダを返す
 */
export function formatPlayerTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "--:--.---";

  const m = Math.floor(ms / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const sub = Math.floor(ms % 1000);

  const mPad = m >= 100 ? String(m).padStart(3, "0") : String(m).padStart(2, "0");
  return `${mPad}:${String(s).padStart(2, "0")}.${String(sub).padStart(3, "0")}`;
}
