import { describe, expect, test } from "vite-plus/test";
import { formatPlayerTime } from "../../../src/lib/player-status/time-format.js";

describe("formatPlayerTime", () => {
  test("0msはゼロ埋め3要素で返す", () => {
    expect(formatPlayerTime(0)).toBe("00:00.000");
  });
  test("通常値 (3分45秒 + 678ms)", () => {
    const ms = 3 * 60_000 + 45 * 1000 + 678;
    expect(formatPlayerTime(ms)).toBe("03:45.678");
  });
  test("ミリ秒3桁でゼロ埋めする", () => {
    expect(formatPlayerTime(4)).toBe("00:00.004");
    expect(formatPlayerTime(50)).toBe("00:00.050");
  });
  test("100分以上で分の桁が3桁 zero-pad", () => {
    expect(formatPlayerTime(101 * 60_000)).toBe("101:00.000");
  });
  test("負値はplaceholder", () => {
    expect(formatPlayerTime(-1)).toBe("--:--.---");
  });
  test("NaNはplaceholder", () => {
    expect(formatPlayerTime(Number.NaN)).toBe("--:--.---");
  });
  test("Infinityはplaceholder", () => {
    expect(formatPlayerTime(Number.POSITIVE_INFINITY)).toBe("--:--.---");
  });
});
