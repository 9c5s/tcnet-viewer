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

// Bridge V1.1.8 と CDJ-3000X の組み合わせでは 138 拍目以降が破損して beatNumber が飛び、復元もできないため、連続が途切れた位置以降を除外する
export function dropCorruptedBeatGridEntries(entries: BeatGridEntry[]): BeatGridEntry[] {
  const end = entries.findIndex(
    (entry, i) => i > 0 && entry.beatNumber !== entries[i - 1].beatNumber + 1,
  );
  return end === -1 ? entries : entries.slice(0, end);
}
