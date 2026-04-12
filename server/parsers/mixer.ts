import type { MixerData, MixerChannel } from "./types.js";

export function parseMixerData(buffer: Buffer): MixerData {
  // チャンネル6のcrossFaderAssign (offset 245+13=258) が最大読み取り位置
  if (buffer.length < 259) {
    throw new RangeError(`MixerData buffer too short: ${buffer.length} < 259`);
  }
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
    crossFaderAssign: buffer.readUInt8(offset + 13),
  });

  return {
    // 識別情報 (25-44)
    mixerId: buffer.readUInt8(25),
    mixerType: buffer.readUInt8(26),
    mixerName: buffer
      .slice(29, 45)
      .toString("ascii")
      // oxlint-disable-next-line no-control-regex -- NULLバイト以降を切り捨てる意図的なパターン
      .replace(/\x00.*$/g, ""),
    // マスター音量 (61, 62, 69)
    masterAudioLevel: buffer.readUInt8(61),
    masterFaderLevel: buffer.readUInt8(62),
    masterFilter: buffer.readUInt8(69),
    // MIC EQ (59, 60)
    micEqHi: buffer.readUInt8(59),
    micEqLow: buffer.readUInt8(60),
    // リンク/マスター CUE (67, 68, 71, 72)
    linkCueA: buffer.readUInt8(67),
    linkCueB: buffer.readUInt8(68),
    masterCueA: buffer.readUInt8(71),
    masterCueB: buffer.readUInt8(72),
    // マスターアイソレータ (74-77)
    masterIsolatorOn: buffer.readUInt8(74) === 1,
    masterIsolatorHi: buffer.readUInt8(75),
    masterIsolatorMid: buffer.readUInt8(76),
    masterIsolatorLow: buffer.readUInt8(77),
    // カラーフィルタ (79-81)
    filterHpf: buffer.readUInt8(79),
    filterLpf: buffer.readUInt8(80),
    filterResonance: buffer.readUInt8(81),
    // Send FX (84-91)
    sendFxEffect: buffer.readUInt8(84),
    sendFxExt1: buffer.readUInt8(85),
    sendFxExt2: buffer.readUInt8(86),
    sendFxMasterMix: buffer.readUInt8(87),
    sendFxSizeFeedback: buffer.readUInt8(88),
    sendFxTime: buffer.readUInt8(89),
    sendFxHpf: buffer.readUInt8(90),
    sendFxLevel: buffer.readUInt8(91),
    // Send Return 3 (92-95)
    sendReturn3Source: buffer.readUInt8(92),
    sendReturn3Type: buffer.readUInt8(93),
    sendReturn3On: buffer.readUInt8(94),
    sendReturn3Level: buffer.readUInt8(95),
    // フェーダーカーブ (97-99)
    channelFaderCurve: buffer.readUInt8(97),
    crossFaderCurve: buffer.readUInt8(98),
    crossFader: buffer.readUInt8(99),
    // Beat FX (100-106)
    beatFxOn: buffer.readUInt8(100) === 1,
    beatFxLevelDepth: buffer.readUInt8(101),
    beatFxChannelSelect: buffer.readUInt8(102),
    beatFxSelect: buffer.readUInt8(103),
    beatFxFreqHi: buffer.readUInt8(104),
    beatFxFreqMid: buffer.readUInt8(105),
    beatFxFreqLow: buffer.readUInt8(106),
    // ヘッドフォン (107-111)
    headphonesPreEq: buffer.readUInt8(107),
    headphonesALevel: buffer.readUInt8(108),
    headphonesAMix: buffer.readUInt8(109),
    headphonesBLevel: buffer.readUInt8(110),
    headphonesBMix: buffer.readUInt8(111),
    // ブース (112-114)
    boothLevel: buffer.readUInt8(112),
    boothEqHi: buffer.readUInt8(113),
    boothEqLow: buffer.readUInt8(114),
    // チャンネル (6ch, offset 125/149/173/197/221/245 ストライド24B)
    channels: [125, 149, 173, 197, 221, 245].map(parseChannel),
  };
}
