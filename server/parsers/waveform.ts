import type { WaveformBar, WaveformData } from "./types.js";

export function parseSmallWaveform(buffer: Buffer): WaveformData {
  const dataStart = 42;
  return parseWaveformBars(buffer.slice(dataStart, dataStart + 2400));
}

export function parseBigWaveform(data: Buffer): WaveformData {
  return parseWaveformBars(data);
}

function parseWaveformBars(data: Buffer): WaveformData {
  const bars: WaveformBar[] = [];
  for (let i = 0; i + 1 < data.length; i += 2) {
    bars.push({
      level: data.readUInt8(i),
      color: data.readUInt8(i + 1),
    });
  }
  return { bars };
}
