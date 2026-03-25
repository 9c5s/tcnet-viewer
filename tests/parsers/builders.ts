// BeatGrid: 8バイト単位 [beatNumber:UInt16LE, beatType:UInt8, pad:1, timestampMs:UInt32LE]
export class BeatGridBuilder {
  private entries: Array<{ beatNumber: number; beatType: number; timestampMs: number }> = [];

  addBeat(beatNumber: number, isDownbeat: boolean, timestampMs: number): this {
    this.entries.push({ beatNumber, beatType: isDownbeat ? 20 : 0, timestampMs });
    return this;
  }

  addRaw(beatNumber: number, beatTypeRaw: number, timestampMs: number): this {
    this.entries.push({ beatNumber, beatType: beatTypeRaw, timestampMs });
    return this;
  }

  build(): Buffer {
    const buffer = Buffer.alloc(this.entries.length * 8);
    for (let i = 0; i < this.entries.length; i++) {
      const e = this.entries[i];
      buffer.writeUInt16LE(e.beatNumber, i * 8);
      buffer.writeUInt8(e.beatType, i * 8 + 2);
      buffer.writeUInt32LE(e.timestampMs, i * 8 + 4);
    }
    return buffer;
  }
}

// CueData: 先頭42バイトヘッダー + [loopInTime:UInt32LE@42, loopOutTime:UInt32LE@46] + CUE 22バイト x 18個 @50
export class CueDataBuilder {
  private loopInTime = 0;
  private loopOutTime = 0;
  private cues: Array<{
    index: number;
    type: number;
    inTime: number;
    outTime: number;
    r: number;
    g: number;
    b: number;
  }> = [];

  setLoopTimes(loopIn: number, loopOut: number): this {
    this.loopInTime = loopIn;
    this.loopOutTime = loopOut;
    return this;
  }

  addCue(
    index: number,
    type: number,
    inTime: number,
    outTime: number,
    color: { r: number; g: number; b: number },
  ): this {
    this.cues.push({ index, type, inTime, outTime, ...color });
    return this;
  }

  build(): Buffer {
    const buffer = Buffer.alloc(50 + 18 * 22);
    buffer.writeUInt32LE(this.loopInTime, 42);
    buffer.writeUInt32LE(this.loopOutTime, 46);
    for (const cue of this.cues) {
      const offset = 50 + (cue.index - 1) * 22;
      buffer.writeUInt8(cue.type, offset);
      buffer.writeUInt32LE(cue.inTime, offset + 2);
      buffer.writeUInt32LE(cue.outTime, offset + 6);
      buffer.writeUInt8(cue.r, offset + 11);
      buffer.writeUInt8(cue.g, offset + 12);
      buffer.writeUInt8(cue.b, offset + 13);
    }
    return buffer;
  }
}

// Mixer: 先頭25バイトヘッダー + 各フィールド。チャンネル: オフセット[125,149,173,197,221,245] (ストライド24バイト, 使用14バイト)
export class MixerDataBuilder {
  private data = Buffer.alloc(270);

  setMixerId(id: number): this {
    this.data.writeUInt8(id, 25);
    return this;
  }

  setMixerType(type: number): this {
    this.data.writeUInt8(type, 26);
    return this;
  }

  setMixerName(name: string): this {
    this.data.fill(0, 29, 45);
    this.data.write(name, 29, "ascii");
    return this;
  }

  setMasterLevels(audio: number, fader: number): this {
    this.data.writeUInt8(audio, 61);
    this.data.writeUInt8(fader, 62);
    return this;
  }

  setMasterIsolatorOn(on: boolean): this {
    this.data.writeUInt8(on ? 1 : 0, 74);
    return this;
  }

  setBeatFxOn(on: boolean): this {
    this.data.writeUInt8(on ? 1 : 0, 100);
    return this;
  }

  setChannel(
    index: number,
    fields: Partial<{
      sourceSelect: number;
      audioLevel: number;
      faderLevel: number;
      trimLevel: number;
      compLevel: number;
      eqHi: number;
      eqHiMid: number;
      eqLowMid: number;
      eqLow: number;
      filterColor: number;
      send: number;
      cueA: number;
      cueB: number;
      crossfaderAssign: number;
    }>,
  ): this {
    const offsets = [125, 149, 173, 197, 221, 245];
    const base = offsets[index];
    if (base === undefined) throw new Error(`Invalid channel index: ${index}`);
    const fieldOrder: (keyof typeof fields)[] = [
      "sourceSelect",
      "audioLevel",
      "faderLevel",
      "trimLevel",
      "compLevel",
      "eqHi",
      "eqHiMid",
      "eqLowMid",
      "eqLow",
      "filterColor",
      "send",
      "cueA",
      "cueB",
      "crossfaderAssign",
    ];
    for (let i = 0; i < fieldOrder.length; i++) {
      const val = fields[fieldOrder[i]];
      if (val !== undefined) this.data.writeUInt8(val, base + i);
    }
    return this;
  }

  build(): Buffer {
    return Buffer.from(this.data);
  }
}

// MultiPacket: 42バイトヘッダー [totalPackets:UInt32LE@30, packetNo:UInt32LE@34, clusterSize:UInt32LE@38] + data@42
export function createMultiPacketBuffer(
  totalPackets: number,
  packetNo: number,
  clusterSize: number,
  data: number[],
): Buffer {
  const buffer = Buffer.alloc(42 + clusterSize);
  buffer.writeUInt32LE(totalPackets, 30);
  buffer.writeUInt32LE(packetNo, 34);
  buffer.writeUInt32LE(clusterSize, 38);
  for (let i = 0; i < data.length; i++) {
    buffer.writeUInt8(data[i], 42 + i);
  }
  return buffer;
}
