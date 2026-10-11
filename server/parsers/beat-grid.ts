import type { BeatGridEntry } from "./types.js";

export function parseBeatGrid(data: Buffer): BeatGridEntry[] {
  const entries: BeatGridEntry[] = [];
  for (let offset = 0; offset + 8 <= data.length; offset += 8) {
    const beatNumber = data.readUInt16LE(offset);
    const beatType = data.readUInt8(offset + 2);
    const timestampMs = data.readUInt32LE(offset + 4);
    if (beatNumber === 0 && timestampMs === 0) continue;
    entries.push({
      beatNumber,
      beatType,
      timestampMs,
    });
  }
  return entries;
}

export type BeatGridRepair = {
  entries: BeatGridEntry[];
  interpolated: number;
  dropped: number;
};

// 欠けをまたぐ拍間隔が、それまでの拍間隔の中央値からこの倍率を超えて外れたら破損とみなす
const MAX_GAP_INTERVAL_RATIO = 2;

function splitByContiguousBeatNumber(entries: BeatGridEntry[]): BeatGridEntry[][] {
  const segments: BeatGridEntry[][] = [];
  for (const entry of entries) {
    const last = segments.at(-1);
    if (last && entry.beatNumber === last[last.length - 1].beatNumber + 1) last.push(entry);
    else segments.push([entry]);
  }
  return segments;
}

function isStrictlyIncreasing(segment: BeatGridEntry[]): boolean {
  return segment.every((entry, i) => i === 0 || entry.timestampMs > segment[i - 1].timestampMs);
}

function medianInterval(entries: BeatGridEntry[]): number {
  const intervals = entries.slice(1).map((entry, i) => entry.timestampMs - entries[i].timestampMs);
  intervals.sort((a, b) => a - b);
  return intervals[Math.floor(intervals.length / 2)] ?? Number.NaN;
}

// Bridge V1.1.8 の BeatGrid は、CDJ-3000 では chunk 単位で拍が欠け、CDJ-3000X では欠けの後ろの時刻が破損する
// 欠けの前後で拍の間隔がつながる区間は残して欠けを線形補間し、つながらない区間以降は除外する
export function repairBeatGridEntries(entries: BeatGridEntry[]): BeatGridRepair {
  const repaired: BeatGridEntry[] = [];
  let interpolated = 0;
  for (const segment of splitByContiguousBeatNumber(entries)) {
    if (!isStrictlyIncreasing(segment)) break;
    const prev = repaired.at(-1);
    if (prev) {
      const first = segment[0];
      const reference = medianInterval(repaired);
      const gapInterval =
        (first.timestampMs - prev.timestampMs) / (first.beatNumber - prev.beatNumber);
      const connected =
        gapInterval > reference / MAX_GAP_INTERVAL_RATIO &&
        gapInterval < reference * MAX_GAP_INTERVAL_RATIO;
      if (!connected) break;
      for (let beatNumber = prev.beatNumber + 1; beatNumber < first.beatNumber; beatNumber++) {
        repaired.push({
          beatNumber,
          // 小節内の位置は 4 拍前の拍と同じとみなす
          beatType: repaired[repaired.length - 4]?.beatType ?? prev.beatType,
          timestampMs: Math.round(prev.timestampMs + gapInterval * (beatNumber - prev.beatNumber)),
        });
        interpolated++;
      }
    }
    repaired.push(...segment);
  }
  return {
    entries: repaired,
    interpolated,
    dropped: entries.length - (repaired.length - interpolated),
  };
}
