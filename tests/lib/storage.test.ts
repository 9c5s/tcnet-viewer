// @vitest-environment node
import { expect, test, beforeEach, afterEach, vi } from "vite-plus/test";
import { getLocalStorageValue } from "$lib/storage.js";

// jsdom依存を追加せずnode環境だけでテストするため、localStorageをMapで手動モック化する
beforeEach(() => {
  const mockStore = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string): string | null => mockStore.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      mockStore.set(key, value);
    },
    removeItem: (key: string): void => {
      mockStore.delete(key);
    },
    clear: (): void => {
      mockStore.clear();
    },
    get length(): number {
      return mockStore.size;
    },
    key: (index: number): string | null => [...mockStore.keys()][index] ?? null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("getLocalStorageValue: キーが存在しない場合はデフォルト値を返す", () => {
  expect(getLocalStorageValue("missing", "default")).toBe("default");
});

test("getLocalStorageValue: parseなしで生の文字列を返す", () => {
  localStorage.setItem("key1", "value1");
  expect(getLocalStorageValue("key1", "default")).toBe("value1");
});

test("getLocalStorageValue: parseで型変換して返す", () => {
  localStorage.setItem("num", "42");
  expect(getLocalStorageValue("num", 0, (raw) => Number(raw))).toBe(42);
});

test("getLocalStorageValue: parseが例外を投げた場合はデフォルト値を返す", () => {
  localStorage.setItem("bad", "notjson");
  const result = getLocalStorageValue<{ a: number }>(
    "bad",
    { a: 1 },
    (raw) => JSON.parse(raw) as { a: number },
  );
  expect(result).toEqual({ a: 1 });
});

test("getLocalStorageValue: JSONパースで複雑なオブジェクトを復元する", () => {
  localStorage.setItem("filters", JSON.stringify({ a: true, b: false }));
  const result = getLocalStorageValue<Record<string, boolean>>(
    "filters",
    {},
    (raw) => JSON.parse(raw) as Record<string, boolean>,
  );
  expect(result).toEqual({ a: true, b: false });
});

test("getLocalStorageValue: 空文字列はデフォルトではなくそのまま返す", () => {
  localStorage.setItem("empty", "");
  expect(getLocalStorageValue("empty", "default")).toBe("");
});

test("getLocalStorageValue: parse結果が不正ならparse内でフォールバック可能", () => {
  localStorage.setItem("mode", "invalid");
  type Mode = "a" | "b";
  const result = getLocalStorageValue<Mode>("mode", "a", (raw) =>
    raw === "a" || raw === "b" ? raw : "a",
  );
  expect(result).toBe("a");
});

test("getLocalStorageValue: localStorageがundefinedの場合はデフォルト値を返す", () => {
  vi.unstubAllGlobals();
  expect(getLocalStorageValue("any", "fallback")).toBe("fallback");
});
