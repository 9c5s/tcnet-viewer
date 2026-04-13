import { describe, expect, test } from "vite-plus/test";
import { formatPlayerTime } from "../../../src/lib/player-status/time-format.js";

describe("formatPlayerTime", () => {
  test("0msはゼロ埋め3要素で返す", () => {
    expect(formatPlayerTime(0)).toBe("00:00:00.0");
  });
  test("通常値 (3分45秒 + 22フレーム + 0.5フレーム)", () => {
    // 3*60000 + 45000 + (22 + 0.5) * (1000/75) = 225000 + 300 = 225300ms
    const ms = 3 * 60000 + 45 * 1000 + Math.round(22.5 * (1000 / 75));
    expect(formatPlayerTime(ms)).toBe("03:45:22.5");
  });
  test("フレーム小数は 0 か 5 のみに丸める", () => {
    expect(formatPlayerTime(Math.round(0.3 * (1000 / 75)))).toBe("00:00:00.0");
    expect(formatPlayerTime(Math.round(0.7 * (1000 / 75)))).toBe("00:00:00.5");
  });
  test("100分以上で分の桁が3桁 zero-pad", () => {
    expect(formatPlayerTime(101 * 60_000)).toBe("101:00:00.0");
  });
  test("負値はplaceholder", () => {
    expect(formatPlayerTime(-1)).toBe("--:--:--.-");
  });
  test("NaNはplaceholder", () => {
    expect(formatPlayerTime(Number.NaN)).toBe("--:--:--.-");
  });
  test("Infinityはplaceholder", () => {
    expect(formatPlayerTime(Number.POSITIVE_INFINITY)).toBe("--:--:--.-");
  });
});
