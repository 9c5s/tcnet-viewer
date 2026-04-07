import { expect, test } from "vite-plus/test";
import {
  formatMmSs,
  formatPosition,
  formatTimecode,
  formatBPM,
  formatSpeedPercent,
  formatHex,
} from "$lib/formatting.js";

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

test("formatMmSs: 負の値は0にクランプされる", () => {
  expect(formatMmSs(-1000)).toBe("00:00.000");
});

test("formatPosition: 負の値は0にクランプされる", () => {
  expect(formatPosition(-1000)).toBe("00:00");
});

test("formatTimecode: 負の値は0にクランプされる", () => {
  expect(formatTimecode(-1000)).toBe("00:00:00.000");
});

test("formatBPM: 負の値は0にクランプされる", () => {
  expect(formatBPM(-100)).toBe("0.00");
});

test("formatSpeedPercent: 1048576 (2^20) を100.00%に変換する", () => {
  expect(formatSpeedPercent(1048576)).toBe("100.00%");
});

test("formatSpeedPercent: 524288 (2^19) を50.00%に変換する", () => {
  expect(formatSpeedPercent(524288)).toBe("50.00%");
});

test("formatSpeedPercent: 0を0.00%に変換する", () => {
  expect(formatSpeedPercent(0)).toBe("0.00%");
});

test("formatSpeedPercent: 1073741 (約+2.38%のピッチベンド) を正しく変換する", () => {
  // 1073741 / 1048576 * 100 = 102.400... → 102.40
  expect(formatSpeedPercent(1073741)).toBe("102.40%");
});

test("formatHex: 指定幅でゼロ埋めの16進数を返す", () => {
  expect(formatHex(0xff, 4)).toBe("00ff");
});

test("formatHex: 0を指定幅で返す", () => {
  expect(formatHex(0, 8)).toBe("00000000");
});

test("formatHex: 幅を超える値はそのまま返す", () => {
  expect(formatHex(0xffffffff, 4)).toBe("ffffffff");
});

test("formatHex: 32bitトークン値を8桁で返す", () => {
  expect(formatHex(0x12345678, 8)).toBe("12345678");
});

test("formatHex: 16bit dest値を4桁で返す", () => {
  expect(formatHex(0xabcd, 4)).toBe("abcd");
});
