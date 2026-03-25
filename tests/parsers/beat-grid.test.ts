import { expect, test } from "vite-plus/test";
import { parseBeatGrid } from "../../server/parsers/beat-grid.js";
import { BeatGridBuilder } from "./builders.js";

test("parseBeatGrid: 単一のdownbeatをパースする", () => {
  const buffer = new BeatGridBuilder().addBeat(1, true, 500).build();
  const result = parseBeatGrid(buffer);
  expect(result).toHaveLength(1);
  expect(result[0]).toEqual({ beatNumber: 1, beatType: "downbeat", timestampMs: 500 });
});

test("parseBeatGrid: upbeatを正しく判定する", () => {
  const buffer = new BeatGridBuilder().addBeat(2, false, 1000).build();
  expect(parseBeatGrid(buffer)[0].beatType).toBe("upbeat");
});

test("parseBeatGrid: beatTypeRaw=20以外は全てupbeatになる", () => {
  const buffer = new BeatGridBuilder().addRaw(1, 19, 100).build();
  expect(parseBeatGrid(buffer)[0].beatType).toBe("upbeat");
});

test("parseBeatGrid: 複数エントリをパースする", () => {
  const buffer = new BeatGridBuilder()
    .addBeat(1, true, 0)
    .addBeat(2, false, 500)
    .addBeat(3, false, 1000)
    .addBeat(4, true, 1500)
    .build();
  const result = parseBeatGrid(buffer);
  expect(result).toHaveLength(4);
  expect(result[0].beatType).toBe("downbeat");
  expect(result[3].beatType).toBe("downbeat");
});

test("parseBeatGrid: beatNumber=0かつtimestamp=0のエントリはスキップする", () => {
  const buffer = Buffer.alloc(16);
  buffer.writeUInt16LE(1, 8);
  buffer.writeUInt8(20, 10);
  buffer.writeUInt32LE(500, 12);
  expect(parseBeatGrid(buffer)).toHaveLength(1);
});

test("parseBeatGrid: 空バッファは空配列を返す", () => {
  expect(parseBeatGrid(Buffer.alloc(0))).toEqual([]);
});

test("parseBeatGrid: 8バイト未満のバッファは空配列を返す", () => {
  expect(parseBeatGrid(Buffer.alloc(7))).toEqual([]);
});

test("parseBeatGrid: 不完全な末尾データは無視する", () => {
  const builder = new BeatGridBuilder().addBeat(1, true, 0);
  const full = builder.build();
  const buffer = Buffer.alloc(13);
  full.copy(buffer);
  expect(parseBeatGrid(buffer)).toHaveLength(1);
});
