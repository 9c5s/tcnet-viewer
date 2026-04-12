import { expect, test } from "vite-plus/test";
import { decodeAppSpecific } from "../../server/parsers/status.js";

test("decodeAppSpecific: nullはundefinedを返す", () => {
  expect(decodeAppSpecific(null)).toBeUndefined();
});

test("decodeAppSpecific: 全NULLバイトはundefinedを返す (空文字のため)", () => {
  expect(decodeAppSpecific(Buffer.alloc(72))).toBeUndefined();
});

test("decodeAppSpecific: NULLパディング前後の印字可能ASCIIを連結する", () => {
  const buf = Buffer.from("PRODJLINK BR\0\0\0EXT", "ascii");
  expect(decodeAppSpecific(buf)).toBe("PRODJLINK BREXT");
});

test("decodeAppSpecific: 制御文字 (0x00-0x1F, 0x7F以上) を除去する", () => {
  const buf = Buffer.from([0x01, 0x41, 0x7f, 0x42, 0x80, 0x43]);
  expect(decodeAppSpecific(buf)).toBe("ABC");
});

test("decodeAppSpecific: 印字可能ASCIIの境界値 (0x20, 0x7E) を保持する", () => {
  const buf = Buffer.from([0x20, 0x7e, 0x1f, 0x7f]);
  expect(decodeAppSpecific(buf)).toBe(" ~");
});
