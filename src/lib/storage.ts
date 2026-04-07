/**
 * localStorageから値を取得するヘルパー関数
 * SSR環境 (localStorage未定義)、キーなし、parse失敗時はデフォルト値を返す
 *
 * @param key localStorageのキー
 * @param defaultValue 取得失敗時のフォールバック値
 * @param parse 生文字列からT型への変換関数 (省略時はそのまま返す)
 */
export function getLocalStorageValue<T>(
  key: string,
  defaultValue: T,
  parse?: (raw: string) => T,
): T {
  try {
    if (typeof localStorage === "undefined") return defaultValue;
    const stored = localStorage.getItem(key);
    if (stored == null) return defaultValue;
    if (!parse) return stored as unknown as T;
    return parse(stored);
  } catch {
    // localStorageアクセス失敗やparse例外はデフォルトにフォールバックする
    return defaultValue;
  }
}
