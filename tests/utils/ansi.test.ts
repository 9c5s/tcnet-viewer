import { expect, test } from "vite-plus/test";
import { stripAnsi } from "../../server/utils/ansi.js";

test("stripAnsi: ANSI色コードを除去する", () => {
  expect(stripAnsi("\u001b[32mSuccess\u001b[0m")).toBe("Success");
});

test("stripAnsi: プレーンテキストは変更しない", () => {
  expect(stripAnsi("plain text")).toBe("plain text");
});

test("stripAnsi: 複数のANSIシーケンスを全て除去する", () => {
  expect(stripAnsi("\u001b[1m\u001b[31mError\u001b[0m: message")).toBe("Error: message");
});

test("stripAnsi: 空文字列を返す", () => {
  expect(stripAnsi("")).toBe("");
});

test("stripAnsi: カーソル移動等の制御シーケンスも除去する", () => {
  expect(stripAnsi("\u001b[2Kline")).toBe("line");
});
