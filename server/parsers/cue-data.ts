import type { CueData, CuePoint } from "./types.js";

export function parseCueData(buffer: Buffer): CueData {
  const loopInTime = buffer.readUInt32LE(42);
  // byte 46-49 (Loop OUT Time) はCUE 1開始(byte 47)と重複するため読み取らない
  // CUE 1にデータがあるとloopOutTimeは汚染された値になる
  const cues: CuePoint[] = [];

  // 仕様書通り CUE 1 開始は byte 47
  const cueStart = 47;
  for (let i = 0; i < 18; i++) {
    const offset = cueStart + i * 22;
    if (offset + 22 > buffer.length) break;
    const type = buffer.readUInt8(offset);
    const inTime = buffer.readUInt32LE(offset + 2);
    const outTime = buffer.readUInt32LE(offset + 6);
    // BridgeはTYPEフィールドを0で送信する場合がある
    // type=0かつinTime/outTime両方0のエントリのみスキップする
    // type有効値(>=1)でinTime/outTime=0のケース(トラック先頭CUE)は保持する
    if (type === 0 && inTime === 0 && outTime === 0) continue;
    cues.push({
      index: i + 1,
      type,
      inTime,
      outTime,
      color: {
        r: buffer.readUInt8(offset + 11),
        g: buffer.readUInt8(offset + 12),
        b: buffer.readUInt8(offset + 13),
      },
    });
  }

  return { loopInTime, cues };
}
