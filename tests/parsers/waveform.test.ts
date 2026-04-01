import { expect, test } from "vite-plus/test";
import { parseSmallWaveform, parseBigWaveform } from "../../server/parsers/waveform.js";

test("parseSmallWaveform: offset 42から2400バイトをパースする", () => {
  const buffer = Buffer.alloc(2442);
  buffer.writeUInt8(100, 42);
  buffer.writeUInt8(5, 43);
  buffer.writeUInt8(200, 44);
  buffer.writeUInt8(3, 45);
  const result = parseSmallWaveform(buffer);
  expect(result.bars[0]).toEqual({ color: 100, level: 5 });
  expect(result.bars[1]).toEqual({ color: 200, level: 3 });
  expect(result.bars).toHaveLength(1200);
});

test("parseBigWaveform: バッファ全体をパースする", () => {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt8(50, 0);
  buffer.writeUInt8(2, 1);
  buffer.writeUInt8(75, 2);
  buffer.writeUInt8(4, 3);
  const result = parseBigWaveform(buffer);
  expect(result.bars).toHaveLength(2);
  expect(result.bars[0]).toEqual({ color: 50, level: 2 });
  expect(result.bars[1]).toEqual({ color: 75, level: 4 });
});

test("parseBigWaveform: 奇数バイトの末尾は無視する", () => {
  const buffer = Buffer.alloc(3);
  buffer.writeUInt8(10, 0);
  buffer.writeUInt8(1, 1);
  buffer.writeUInt8(99, 2);
  expect(parseBigWaveform(buffer).bars).toHaveLength(1);
});

test("parseBigWaveform: 空バッファは空配列を返す", () => {
  expect(parseBigWaveform(Buffer.alloc(0)).bars).toEqual([]);
});

test("parseBigWaveform: 1バイトバッファは空配列を返す", () => {
  expect(parseBigWaveform(Buffer.alloc(1)).bars).toEqual([]);
});
