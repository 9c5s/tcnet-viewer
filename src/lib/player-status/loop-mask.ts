import type { CuePoint, LayerStatus } from "$lib/types.js";

export type ActiveLoop = {
  inTime: number;
  outTime: number;
};

/**
 * LOOPING状態でかつ現在時刻を含むループCueを返す。
 * loopInTime は Bridge からの値が壊れているため参照せず、cues の inTime/outTime を直接使う。
 * 条件: status === "LOOPING" かつ outTime > 0 かつ inTime <= currentTimeMs < outTime
 * 該当なしは null を返す。複数該当時は先頭を採用する (通常は一意)
 */
export function selectActiveLoop(
  status: LayerStatus,
  cues: CuePoint[] | null,
  currentTimeMs: number,
): ActiveLoop | null {
  if (status !== "LOOPING") return null;
  if (!cues || cues.length === 0) return null;
  for (const cue of cues) {
    if (cue.outTime <= 0) continue;
    if (cue.inTime <= currentTimeMs && currentTimeMs < cue.outTime) {
      return { inTime: cue.inTime, outTime: cue.outTime };
    }
  }
  return null;
}
