import { expect, test } from "vite-plus/test";
import { artworkToBase64, detectArtworkMimeType } from "../../server/parsers/artwork.js";

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

test("detectArtworkMimeType: JPEGマジックバイトはimage/jpegを返す", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0x00, 0x00]);
  expect(detectArtworkMimeType(jpeg)).toBe("image/jpeg");
});

test("detectArtworkMimeType: PNGマジックバイトはimage/pngを返す", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]);
  expect(detectArtworkMimeType(png)).toBe("image/png");
});

test("detectArtworkMimeType: 不明なバイト列はimage/jpegにフォールバックする", () => {
  const unknown = Buffer.from([0x00, 0x00, 0x00, 0x00]);
  expect(detectArtworkMimeType(unknown)).toBe("image/jpeg");
});

test("detectArtworkMimeType: 空バッファはimage/jpegにフォールバックする", () => {
  expect(detectArtworkMimeType(Buffer.alloc(0))).toBe("image/jpeg");
});
