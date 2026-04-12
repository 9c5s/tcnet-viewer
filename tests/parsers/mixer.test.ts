import { expect, test } from "vite-plus/test";
import { parseMixerData } from "../../server/parsers/mixer.js";
import { MixerDataBuilder } from "./builders.js";

test("parseMixerData: mixerIdとmixerTypeを読み取る", () => {
  const buffer = new MixerDataBuilder().setMixerId(10).setMixerType(3).build();
  const result = parseMixerData(buffer);
  expect(result.mixerId).toBe(10);
  expect(result.mixerType).toBe(3);
});

test("parseMixerData: mixerNameを読み取りNULLバイト以降を切り捨てる", () => {
  const buffer = new MixerDataBuilder().setMixerName("DJM-900NXS2").build();
  expect(parseMixerData(buffer).mixerName).toBe("DJM-900NXS2");
});

test("parseMixerData: mixerNameが全NULLなら空文字列を返す", () => {
  const buffer = new MixerDataBuilder().build();
  expect(parseMixerData(buffer).mixerName).toBe("");
});

test("parseMixerData: masterIsolatorOnをbooleanに変換する", () => {
  const on = new MixerDataBuilder().setMasterIsolatorOn(true).build();
  const off = new MixerDataBuilder().setMasterIsolatorOn(false).build();
  expect(parseMixerData(on).masterIsolatorOn).toBe(true);
  expect(parseMixerData(off).masterIsolatorOn).toBe(false);
});

test("parseMixerData: beatFxOnをbooleanに変換する", () => {
  const on = new MixerDataBuilder().setBeatFxOn(true).build();
  expect(parseMixerData(on).beatFxOn).toBe(true);
});

test("parseMixerData: masterAudioLevel/FaderLevelを読み取る", () => {
  const buffer = new MixerDataBuilder().setMasterLevels(200, 150).build();
  const result = parseMixerData(buffer);
  expect(result.masterAudioLevel).toBe(200);
  expect(result.masterFaderLevel).toBe(150);
});

test("parseMixerData: 6チャンネルをパースする", () => {
  const buffer = new MixerDataBuilder()
    .setChannel(0, { faderLevel: 100, audioLevel: 80 })
    .setChannel(5, { faderLevel: 200, audioLevel: 255 })
    .build();
  const result = parseMixerData(buffer);
  expect(result.channels).toHaveLength(6);
  expect(result.channels[0].faderLevel).toBe(100);
  expect(result.channels[0].audioLevel).toBe(80);
  expect(result.channels[5].faderLevel).toBe(200);
  expect(result.channels[5].audioLevel).toBe(255);
});

test("parseMixerData: デフォルト値で全フィールドが0/falseになる", () => {
  const result = parseMixerData(new MixerDataBuilder().build());
  expect(result.masterAudioLevel).toBe(0);
  expect(result.masterIsolatorOn).toBe(false);
  expect(result.beatFxOn).toBe(false);
  expect(result.channels[0].faderLevel).toBe(0);
  // 拡張フィールドもデフォルトで0
  expect(result.micEqHi).toBe(0);
  expect(result.masterCueA).toBe(0);
  expect(result.sendFxLevel).toBe(0);
  expect(result.boothEqHi).toBe(0);
});

test("parseMixerData: 拡張フィールドを仕様オフセット通り読み取る", () => {
  // node-tcnet側のオフセットに整合:
  // micEqHi=59, micEqLow=60, linkCueA=67, linkCueB=68, masterCueA=71, masterCueB=72,
  // sendFxEffect=84, sendFxLevel=91, sendReturn3On=94, beatFxFreqHi=104,
  // headphonesPreEq=107, headphonesAMix=109, headphonesBMix=111, boothEqHi=113, boothEqLow=114
  const buffer = new MixerDataBuilder()
    .setByte(59, 11)
    .setByte(60, 12)
    .setByte(67, 21)
    .setByte(68, 22)
    .setByte(71, 31)
    .setByte(72, 32)
    .setByte(84, 41)
    .setByte(91, 51)
    .setByte(94, 61)
    .setByte(104, 71)
    .setByte(107, 81)
    .setByte(109, 91)
    .setByte(111, 101)
    .setByte(113, 111)
    .setByte(114, 121)
    .build();
  const result = parseMixerData(buffer);
  expect(result.micEqHi).toBe(11);
  expect(result.micEqLow).toBe(12);
  expect(result.linkCueA).toBe(21);
  expect(result.linkCueB).toBe(22);
  expect(result.masterCueA).toBe(31);
  expect(result.masterCueB).toBe(32);
  expect(result.sendFxEffect).toBe(41);
  expect(result.sendFxLevel).toBe(51);
  expect(result.sendReturn3On).toBe(61);
  expect(result.beatFxFreqHi).toBe(71);
  expect(result.headphonesPreEq).toBe(81);
  expect(result.headphonesAMix).toBe(91);
  expect(result.headphonesBMix).toBe(101);
  expect(result.boothEqHi).toBe(111);
  expect(result.boothEqLow).toBe(121);
});
