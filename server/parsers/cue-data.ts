import type { CueData, CuePoint } from "./types.js";

export function parseCueData(buffer: Buffer): CueData {
  const loopInTime = buffer.readUInt32LE(42);
  const loopOutTime = buffer.readUInt32LE(46);
  const cues: CuePoint[] = [];

  // CUE 1開始: byte 50 (header 24 + DataType 1 + LayerID 1 + RESERVED 16 + LoopIN 4 + LoopOUT 4 = 50)
  const cueStart = 50;
  for (let i = 0; i < 18; i++) {
    const offset = cueStart + i * 22;
    if (offset + 22 > buffer.length) break;
    const type = buffer.readUInt8(offset);
    if (type === 0) continue;
    cues.push({
      index: i + 1,
      type,
      inTime: buffer.readUInt32LE(offset + 2),
      outTime: buffer.readUInt32LE(offset + 6),
      color: {
        r: buffer.readUInt8(offset + 11),
        g: buffer.readUInt8(offset + 12),
        b: buffer.readUInt8(offset + 13),
      },
    });
  }

  return { loopInTime, loopOutTime, cues };
}
