import { expect, test, describe } from "vite-plus/test";
import {
  artworkToBase64,
  detectArtworkMimeType,
  isValidImageData,
  processArtworkPacket,
  trimJpegPadding,
} from "../../server/parsers/artwork.js";

// --- artworkToBase64 ---

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

// --- detectArtworkMimeType ---

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

// --- isValidImageData ---

describe("isValidImageData", () => {
  // JPEG: SOIとEOIの両方が揃った場合のみ有効とする
  test("EOIマーカーあり (0xFF 0xD9) のJPEGを有効と判定する", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
    expect(isValidImageData(jpeg)).toBe(true);
  });

  test("EOIマーカーなしのJPEG (途中で切れたデータ) を無効と判定する", () => {
    const truncated = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(isValidImageData(truncated)).toBe(false);
  });

  test("SOIのみ (2バイト) のJPEGを無効と判定する", () => {
    expect(isValidImageData(Buffer.from([0xff, 0xd8]))).toBe(false);
  });

  test("末尾にパディングがあってもEOIマーカーを検出して有効と判定する", () => {
    // EOIマーカー (0xFF 0xD9) の後に余分なバイトが続くケース
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9, 0x00, 0x00]);
    expect(isValidImageData(jpeg)).toBe(true);
  });

  test("PNGマジックバイト (0x89 0x50 0x4E 0x47) を有効と判定する", () => {
    expect(isValidImageData(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBe(true);
  });

  test("PNGマジックバイト + 後続データを有効と判定する", () => {
    expect(isValidImageData(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe(true);
  });

  test("不明なバイト列を無効と判定する", () => {
    expect(isValidImageData(Buffer.from([0x00, 0x00, 0x00, 0x00]))).toBe(false);
  });

  test("空バッファを無効と判定する", () => {
    expect(isValidImageData(Buffer.alloc(0))).toBe(false);
  });

  test("1バイトのバッファを無効と判定する", () => {
    expect(isValidImageData(Buffer.from([0xff]))).toBe(false);
  });

  test("JPEGの先頭バイトだけ一致しても無効と判定する", () => {
    expect(isValidImageData(Buffer.from([0xff, 0x00]))).toBe(false);
  });

  test("PNGの先頭3バイトだけ一致しても無効と判定する", () => {
    expect(isValidImageData(Buffer.from([0x89, 0x50, 0x4e]))).toBe(false);
  });
});

// --- trimJpegPadding ---

describe("trimJpegPadding", () => {
  test("EOI以降のnullパディングを除去する", () => {
    const data = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9, 0x00, 0x00, 0x00]);
    expect(trimJpegPadding(data)).toEqual(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]));
  });

  test("EOIが末尾にある場合はそのまま返す", () => {
    const data = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
    expect(trimJpegPadding(data)).toEqual(data);
  });

  test("EOIマーカーがない場合はそのまま返す", () => {
    const data = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
    expect(trimJpegPadding(data)).toEqual(data);
  });

  test("大量のnullパディングがあっても正しくトリミングする", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
    const padding = Buffer.alloc(1000);
    const data = Buffer.concat([jpeg, padding]);
    expect(trimJpegPadding(data)).toEqual(jpeg);
  });
});

// --- processArtworkPacket ---

describe("processArtworkPacket", () => {
  test("有効なJPEGバッファ (SOI + EOIあり) からbase64とmimeTypeを返す", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0xff, 0xd9]);
    const result = processArtworkPacket(jpeg);
    expect(result).not.toBeNull();
    expect(result!.mimeType).toBe("image/jpeg");
    expect(result!.base64).toBe(jpeg.toString("base64"));
  });

  test("EOIマーカーなしの不完全なJPEGはnullを返す", () => {
    const truncated = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(processArtworkPacket(truncated)).toBeNull();
  });

  test("有効なPNGバッファからbase64とmimeTypeを返す", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    const result = processArtworkPacket(png);
    expect(result).not.toBeNull();
    expect(result!.mimeType).toBe("image/png");
    expect(result!.base64).toBe(png.toString("base64"));
  });

  test("undefinedの場合はnullを返す", () => {
    expect(processArtworkPacket(undefined)).toBeNull();
  });

  test("空バッファの場合はnullを返す", () => {
    expect(processArtworkPacket(Buffer.alloc(0))).toBeNull();
  });

  test("無効なマジックバイトの場合はnullを返す", () => {
    expect(processArtworkPacket(Buffer.from([0x00, 0x01, 0x02, 0x03]))).toBeNull();
  });

  test("base64を正しくデコードすると元のバッファに戻る", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xaa, 0xbb, 0xcc, 0xff, 0xd9]);
    const result = processArtworkPacket(jpeg)!;
    expect(Buffer.from(result.base64, "base64")).toEqual(jpeg);
  });

  test("nullパディング付きJPEGはトリミングされたbase64を返す", () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xd9]);
    const padded = Buffer.concat([jpeg, Buffer.alloc(100)]);
    const result = processArtworkPacket(padded)!;
    expect(result).not.toBeNull();
    expect(Buffer.from(result.base64, "base64")).toEqual(jpeg);
  });
});
