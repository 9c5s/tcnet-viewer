import type { WaveformBar, WaveformData } from "./types.js";

// BigWaveFormはマルチパケット組み立て後の連続バッファを受ける (SmallWaveFormはnode-tcnet側でパース済み)
export function parseBigWaveform(data: Buffer): WaveformData {
  const bars: WaveformBar[] = [];
  for (let i = 0; i + 1 < data.length; i += 2) {
    bars.push({
      color: data.readUInt8(i),
      level: data.readUInt8(i + 1),
    });
  }
  return { bars };
}
