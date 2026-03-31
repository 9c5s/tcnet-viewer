import { expect, test } from "vite-plus/test";
import { parseCueData } from "../../server/parsers/cue-data.js";
import { CueDataBuilder } from "./builders.js";

test("parseCueData: ループイン/アウト時間をパースする", () => {
  const buffer = new CueDataBuilder().setLoopTimes(5000, 25000).build();
  const result = parseCueData(buffer);
  expect(result.loopInTime).toBe(5000);
  expect(result.loopOutTime).toBe(25000);
});

test("parseCueData: CUEポイントをパースする", () => {
  const buffer = new CueDataBuilder().addCue(1, 1, 1000, 5000, { r: 255, g: 0, b: 0 }).build();
  const result = parseCueData(buffer);
  expect(result.cues).toHaveLength(1);
  expect(result.cues[0]).toEqual({
    index: 1,
    type: 1,
    inTime: 1000,
    outTime: 5000,
    color: { r: 255, g: 0, b: 0 },
  });
});

test("parseCueData: inTime/outTime共に0のCUEはスキップする", () => {
  const buffer = new CueDataBuilder()
    .addCue(1, 1, 0, 0, { r: 0, g: 0, b: 0 })
    .addCue(2, 1, 5000, 10000, { r: 0, g: 255, b: 0 })
    .build();
  const result = parseCueData(buffer);
  expect(result.cues).toHaveLength(1);
  expect(result.cues[0].index).toBe(2);
});

test("parseCueData: type=0でもinTimeが非0ならエントリに含まれる", () => {
  const buffer = new CueDataBuilder().addCue(1, 0, 563, 0, { r: 0, g: 0, b: 0 }).build();
  const result = parseCueData(buffer);
  expect(result.cues).toHaveLength(1);
  expect(result.cues[0].type).toBe(0);
  expect(result.cues[0].inTime).toBe(563);
});

test("parseCueData: 複数CUEポイントのRGBを正しく読み取る", () => {
  const buffer = new CueDataBuilder()
    .addCue(1, 1, 1000, 0, { r: 255, g: 128, b: 0 })
    .addCue(3, 2, 2000, 0, { r: 0, g: 0, b: 255 })
    .build();
  const result = parseCueData(buffer);
  expect(result.cues[0].color).toEqual({ r: 255, g: 128, b: 0 });
  expect(result.cues[1].color).toEqual({ r: 0, g: 0, b: 255 });
});

test("parseCueData: CUEなしのバッファは空配列を返す", () => {
  const buffer = new CueDataBuilder().build();
  expect(parseCueData(buffer).cues).toEqual([]);
});

test("parseCueData: 短いバッファでCUEが途切れた場合は読める分だけ返す", () => {
  const buffer = new CueDataBuilder()
    .addCue(1, 1, 1000, 2000, { r: 100, g: 100, b: 100 })
    .addCue(2, 1, 3000, 0, { r: 0, g: 0, b: 0 })
    .build()
    .slice(0, 70); // CUE 1 (byte 47-68) は収まるが CUE 2 (byte 69+) は切れる
  const result = parseCueData(buffer);
  expect(result.cues).toHaveLength(1);
});
