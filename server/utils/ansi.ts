// ANSI制御シーケンスを除去する (Vite等の色付きログ対策)
// oxlint-disable-next-line no-control-regex -- ANSI ESCを意図的にマッチさせている
export const stripAnsi = (s: string): string => s.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, "");
