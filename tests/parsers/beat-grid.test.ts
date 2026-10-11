import { describe, expect, test } from "vite-plus/test";
import { parseBeatGrid, repairBeatGridEntries } from "../../server/parsers/beat-grid.js";
import type { BeatGridEntry } from "../../server/parsers/types.js";
import { BeatGridBuilder } from "./builders.js";

test("parseBeatGrid: 単一エントリをパースする", () => {
  const buffer = new BeatGridBuilder().addBeat(1, true, 500).build();
  const result = parseBeatGrid(buffer);
  expect(result).toHaveLength(1);
  expect(result[0]).toEqual({ beatNumber: 1, beatType: 20, timestampMs: 500 });
});

test("parseBeatGrid: beatType生値をそのまま返す", () => {
  const buffer = new BeatGridBuilder().addRaw(1, 19, 100).build();
  expect(parseBeatGrid(buffer)[0].beatType).toBe(19);
});

test("parseBeatGrid: downbeat以外のbeatTypeも保持する", () => {
  const buffer = new BeatGridBuilder().addBeat(2, false, 1000).build();
  expect(parseBeatGrid(buffer)[0].beatType).toBe(0);
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
  expect(result[0].beatType).toBe(20);
  expect(result[3].beatType).toBe(20);
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

describe("repairBeatGridEntries", () => {
  const INTERVAL = 400;

  // 4 拍ごとに downbeat (20) を置いた一定テンポの拍を作る
  function beats(from: number, to: number): BeatGridEntry[] {
    const result: BeatGridEntry[] = [];
    for (let n = from; n <= to; n++) {
      result.push({
        beatNumber: n,
        beatType: (n - 1) % 4 === 0 ? 20 : 10,
        timestampMs: n * INTERVAL,
      });
    }
    return result;
  }

  test("欠けのない BeatGrid はそのまま返す", () => {
    const all = beats(1, 600);
    expect(repairBeatGridEntries(all)).toEqual({ entries: all, interpolated: 0, dropped: 0 });
  });

  test("CDJ-3000 で 1 chunk 分 (171 拍) 欠けた区間を補間し、後ろの拍を残す", () => {
    const result = repairBeatGridEntries([...beats(1, 170), ...beats(342, 617)]);
    expect(result.entries).toEqual(beats(1, 617));
    expect(result.interpolated).toBe(171);
    expect(result.dropped).toBe(0);
  });

  test("離れた複数の欠けをそれぞれ補間する", () => {
    const result = repairBeatGridEntries([
      ...beats(1, 170),
      ...beats(342, 512),
      ...beats(684, 800),
    ]);
    expect(result.entries).toEqual(beats(1, 800));
    expect(result.interpolated).toBe(342);
  });

  test("CDJ-3000X で欠けの後ろの時刻が破損した区間以降を除外する", () => {
    // 欠けの後ろは拍番号が連続するが、レコード境界のずれで時刻が前後する
    const corrupted = [7012356, 1507329, 12845058, 7340035].map((timestampMs, i) => ({
      beatNumber: 171 + i,
      beatType: 0,
      timestampMs,
    }));
    const result = repairBeatGridEntries([...beats(1, 137), ...corrupted]);
    expect(result).toEqual({ entries: beats(1, 137), interpolated: 0, dropped: 4 });
  });

  test("欠けの前後で拍の間隔がつながらない区間以降を除外する", () => {
    const shifted = beats(342, 400).map((entry) => ({
      ...entry,
      timestampMs: entry.timestampMs * 10,
    }));
    const result = repairBeatGridEntries([...beats(1, 170), ...shifted]);
    expect(result).toEqual({ entries: beats(1, 170), interpolated: 0, dropped: shifted.length });
  });

  test("空の BeatGrid は空のまま返す", () => {
    expect(repairBeatGridEntries([])).toEqual({ entries: [], interpolated: 0, dropped: 0 });
  });
});
