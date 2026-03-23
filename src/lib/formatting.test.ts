import { expect, test } from "vite-plus/test";
import { formatMmSs, formatPosition, formatTimecode, formatBPM } from "./formatting.js";

test("formatMmSs: ミリ秒をMM:SS.mmm形式に変換する", () => {
  expect(formatMmSs(125400)).toBe("02:05.400");
});

test("formatMmSs: 0を00:00.000に変換する", () => {
  expect(formatMmSs(0)).toBe("00:00.000");
});

test("formatPosition: ミリ秒をMM:SS形式に変換する", () => {
  expect(formatPosition(125400)).toBe("02:05");
});

test("formatPosition: 0を00:00に変換する", () => {
  expect(formatPosition(0)).toBe("00:00");
});

test("formatTimecode: ミリ秒をHH:MM:SS.mmm形式に変換する", () => {
  expect(formatTimecode(3725400)).toBe("01:02:05.400");
});

test("formatTimecode: 0を00:00:00.000に変換する", () => {
  expect(formatTimecode(0)).toBe("00:00:00.000");
});

test("formatBPM: BPM生値を小数2桁文字列に変換する", () => {
  expect(formatBPM(12800)).toBe("128.00");
});

test("formatBPM: 0を0.00に変換する", () => {
  expect(formatBPM(0)).toBe("0.00");
});

test("formatMmSs: 秒未満の入力を正しく変換する", () => {
  expect(formatMmSs(999)).toBe("00:00.999");
});

test("formatMmSs: 分の繰り上がり直前を正しく変換する", () => {
  expect(formatMmSs(59999)).toBe("00:59.999");
});

test("formatTimecode: 時の繰り上がり直前を正しく変換する", () => {
  expect(formatTimecode(3599999)).toBe("00:59:59.999");
});

test("formatBPM: 端数が生じるBPM値を正しく変換する", () => {
  expect(formatBPM(12345)).toBe("123.45");
});
