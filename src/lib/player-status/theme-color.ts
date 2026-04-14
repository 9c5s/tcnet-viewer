/**
 * Canvas描画用にTailwind/DaisyUIテーマCSS変数を読み取るヘルパー。
 * テーマ切替時は呼び出し元の再描画で自動追従する
 */
export function themeColor(name: string): string {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!m) return null;
  const h =
    m[1]!.length === 3
      ? m[1]!
          .split("")
          .map((c) => c + c)
          .join("")
      : m[1]!;
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/**
 * テーマ色を`rgba()`形式で返す。16進値のみ対応。
 * oklch等のhex以外は元値をそのまま返す (フォールバック)
 */
export function themeRgba(name: string, alpha: number): string {
  const value = themeColor(name);
  const rgb = hexToRgb(value);
  if (!rgb) return value;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}
