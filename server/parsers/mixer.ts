import type { MixerData, MixerChannel } from "./types.js";

export function parseMixerData(buffer: Buffer): MixerData {
  const parseChannel = (offset: number): MixerChannel => ({
    sourceSelect: buffer.readUInt8(offset),
    audioLevel: buffer.readUInt8(offset + 1),
    faderLevel: buffer.readUInt8(offset + 2),
    trimLevel: buffer.readUInt8(offset + 3),
    compLevel: buffer.readUInt8(offset + 4),
    eqHi: buffer.readUInt8(offset + 5),
    eqHiMid: buffer.readUInt8(offset + 6),
    eqLowMid: buffer.readUInt8(offset + 7),
    eqLow: buffer.readUInt8(offset + 8),
    filterColor: buffer.readUInt8(offset + 9),
    send: buffer.readUInt8(offset + 10),
    cueA: buffer.readUInt8(offset + 11),
    cueB: buffer.readUInt8(offset + 12),
    crossfaderAssign: buffer.readUInt8(offset + 13),
  });

  return {
    mixerId: buffer.readUInt8(25),
    mixerType: buffer.readUInt8(26),
    mixerName: buffer
      .slice(29, 45)
      .toString("ascii")
      .replace(/\x00.*$/g, ""),
    masterAudioLevel: buffer.readUInt8(61),
    masterFaderLevel: buffer.readUInt8(62),
    masterFilter: buffer.readUInt8(69),
    masterIsolatorOn: buffer.readUInt8(74) === 1,
    masterIsolatorHi: buffer.readUInt8(75),
    masterIsolatorMid: buffer.readUInt8(76),
    masterIsolatorLow: buffer.readUInt8(77),
    filterHpf: buffer.readUInt8(79),
    filterLpf: buffer.readUInt8(80),
    filterResonance: buffer.readUInt8(81),
    crossFader: buffer.readUInt8(99),
    crossFaderCurve: buffer.readUInt8(98),
    channelFaderCurve: buffer.readUInt8(97),
    beatFxOn: buffer.readUInt8(100) === 1,
    beatFxSelect: buffer.readUInt8(103),
    beatFxLevelDepth: buffer.readUInt8(101),
    beatFxChannelSelect: buffer.readUInt8(102),
    headphonesALevel: buffer.readUInt8(108),
    headphonesBLevel: buffer.readUInt8(110),
    boothLevel: buffer.readUInt8(112),
    channels: [125, 149, 173, 197, 221, 245].map(parseChannel),
  };
}
