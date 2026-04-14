import { describe, expect, test } from "vite-plus/test";
import { selectActiveLoop } from "../../../src/lib/player-status/loop-mask.js";
import type { CuePoint, LayerStatus } from "../../../src/lib/types.js";

const cue = (inTime: number, outTime: number, index = 1): CuePoint => ({
  index,
  type: 1,
  inTime,
  outTime,
  color: { r: 255, g: 158, b: 100 },
});

describe("selectActiveLoop", () => {
  test("status が LOOPING 以外なら null", () => {
    const cues = [cue(1000, 5000)];
    const nonLooping: LayerStatus[] = ["IDLE", "PLAYING", "PAUSED", "STOPPED"];
    for (const s of nonLooping) {
      expect(selectActiveLoop(s, cues, 3000)).toBeNull();
    }
  });

  test("cues が null なら null", () => {
    expect(selectActiveLoop("LOOPING", null, 1000)).toBeNull();
  });

  test("cues が空配列なら null", () => {
    expect(selectActiveLoop("LOOPING", [], 1000)).toBeNull();
  });

  test("LOOPING でも現在時刻を含むループがなければ null", () => {
    const cues = [cue(1000, 5000)];
    expect(selectActiveLoop("LOOPING", cues, 500)).toBeNull();
    expect(selectActiveLoop("LOOPING", cues, 6000)).toBeNull();
  });

  test("outTime が 0 のエントリは対象外 (通常Cue)", () => {
    const cues = [cue(1000, 0)];
    expect(selectActiveLoop("LOOPING", cues, 1500)).toBeNull();
  });

  test("境界: currentTimeMs === inTime なら含む", () => {
    const cues = [cue(1000, 5000)];
    expect(selectActiveLoop("LOOPING", cues, 1000)).toEqual({ inTime: 1000, outTime: 5000 });
  });

  test("境界: currentTimeMs === outTime なら含まない", () => {
    const cues = [cue(1000, 5000)];
    expect(selectActiveLoop("LOOPING", cues, 5000)).toBeNull();
  });

  test("LOOPING かつ範囲内ならループ情報を返す", () => {
    const cues = [cue(1000, 5000)];
    expect(selectActiveLoop("LOOPING", cues, 3000)).toEqual({ inTime: 1000, outTime: 5000 });
  });

  test("複数のループが定義され、現在時刻を含むものを返す", () => {
    const cues = [cue(1000, 2000, 1), cue(5000, 8000, 2), cue(10000, 12000, 3)];
    expect(selectActiveLoop("LOOPING", cues, 6000)).toEqual({ inTime: 5000, outTime: 8000 });
  });

  test("通常Cueとループが混在しても、ループのみ抽出する", () => {
    const cues = [cue(500, 0, 1), cue(1000, 3000, 2), cue(4000, 0, 3)];
    expect(selectActiveLoop("LOOPING", cues, 2000)).toEqual({ inTime: 1000, outTime: 3000 });
  });

  test("inTime > outTime の壊れたループデータは無視される", () => {
    const cues = [cue(5000, 1000)];
    expect(selectActiveLoop("LOOPING", cues, 3000)).toBeNull();
  });
});
