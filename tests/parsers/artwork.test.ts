import { expect, test } from "vite-plus/test";
import { artworkToBase64 } from "../../server/parsers/artwork.js";

test("artworkToBase64: バッファをBase64文字列に変換する", () => {
  const buffer = Buffer.from("Hello");
  expect(artworkToBase64(buffer)).toBe("SGVsbG8=");
});

test("artworkToBase64: 空バッファは空文字列を返す", () => {
  expect(artworkToBase64(Buffer.alloc(0))).toBe("");
});

test("artworkToBase64: バイナリデータを正しくエンコードする", () => {
  const buffer = Buffer.from([0x00, 0xff, 0xab, 0xcd]);
  const base64 = artworkToBase64(buffer);
  expect(Buffer.from(base64, "base64")).toEqual(buffer);
});
