import type { BeatGridEntry } from "./types.js";

export function parseBeatGrid(data: Buffer): BeatGridEntry[] {
  const entries: BeatGridEntry[] = [];
  for (let offset = 0; offset + 8 <= data.length; offset += 8) {
    const beatNumber = data.readUInt16LE(offset);
    const beatTypeRaw = data.readUInt8(offset + 2);
    const timestampMs = data.readUInt32LE(offset + 4);
    if (beatNumber === 0 && timestampMs === 0) continue;
    entries.push({
      beatNumber,
      beatType: beatTypeRaw === 20 ? "downbeat" : "upbeat",
      timestampMs,
    });
  }
  return entries;
}
