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

test("parseMixerData: 拡張フィールドがUInt8境界値 (0/255) を正しく読み取る", () => {
  // 0 はデフォルト値と等価なため「default test」と重複しない形にするため、
  // オフセットごとに 255 を書き込み、read側のオフセット指定ミスを検出する
  const buffer = new MixerDataBuilder()
    .setByte(59, 255)
    .setByte(71, 255)
    .setByte(91, 255)
    .setByte(94, 255)
    .setByte(113, 255)
    .build();
  const result = parseMixerData(buffer);
  expect(result.micEqHi).toBe(255);
  expect(result.masterCueA).toBe(255);
  expect(result.sendFxLevel).toBe(255);
  expect(result.sendReturn3On).toBe(255);
  expect(result.boothEqHi).toBe(255);
});

test("parseMixerData: 隣接オフセットは相互に干渉しない", () => {
  // micEqHi(59) と micEqLow(60) は隣接しており、オフセットのoff-by-oneを検出する
  const hiOnly = parseMixerData(new MixerDataBuilder().setByte(59, 123).build());
  expect(hiOnly.micEqHi).toBe(123);
  expect(hiOnly.micEqLow).toBe(0);

  const lowOnly = parseMixerData(new MixerDataBuilder().setByte(60, 234).build());
  expect(lowOnly.micEqHi).toBe(0);
  expect(lowOnly.micEqLow).toBe(234);

  // boothEqHi(113) と boothEqLow(114) も同様に隣接する最終フィールド
  const booth = parseMixerData(new MixerDataBuilder().setByte(113, 50).build());
  expect(booth.boothEqHi).toBe(50);
  expect(booth.boothEqLow).toBe(0);
});

test("parseMixerData: PR#86追加の拡張フィールド26個に互いに異なる非ゼロ値を与え全て正しく読み出す", () => {
  // node-tcnet仕様に整合するオフセットごとに1-26の連番を書き込み、
  // (a) どのフィールドも0のまま取り残されない (b) offset取り違えが起きないことを
  // 同時に検証する。境界値テストやデフォルト0テストでは捕まえにくい
  // 「隣接しない2フィールドを入れ違えた場合」の退行検出を担う
  const buffer = new MixerDataBuilder()
    .setByte(59, 1) // micEqHi
    .setByte(60, 2) // micEqLow
    .setByte(67, 3) // linkCueA
    .setByte(68, 4) // linkCueB
    .setByte(71, 5) // masterCueA
    .setByte(72, 6) // masterCueB
    .setByte(84, 7) // sendFxEffect
    .setByte(85, 8) // sendFxExt1
    .setByte(86, 9) // sendFxExt2
    .setByte(87, 10) // sendFxMasterMix
    .setByte(88, 11) // sendFxSizeFeedback
    .setByte(89, 12) // sendFxTime
    .setByte(90, 13) // sendFxHpf
    .setByte(91, 14) // sendFxLevel
    .setByte(92, 15) // sendReturn3Source
    .setByte(93, 16) // sendReturn3Type
    .setByte(94, 17) // sendReturn3On
    .setByte(95, 18) // sendReturn3Level
    .setByte(104, 19) // beatFxFreqHi
    .setByte(105, 20) // beatFxFreqMid
    .setByte(106, 21) // beatFxFreqLow
    .setByte(107, 22) // headphonesPreEq
    .setByte(109, 23) // headphonesAMix
    .setByte(111, 24) // headphonesBMix
    .setByte(113, 25) // boothEqHi
    .setByte(114, 26) // boothEqLow
    .build();
  const result = parseMixerData(buffer);
  expect(result.micEqHi).toBe(1);
  expect(result.micEqLow).toBe(2);
  expect(result.linkCueA).toBe(3);
  expect(result.linkCueB).toBe(4);
  expect(result.masterCueA).toBe(5);
  expect(result.masterCueB).toBe(6);
  expect(result.sendFxEffect).toBe(7);
  expect(result.sendFxExt1).toBe(8);
  expect(result.sendFxExt2).toBe(9);
  expect(result.sendFxMasterMix).toBe(10);
  expect(result.sendFxSizeFeedback).toBe(11);
  expect(result.sendFxTime).toBe(12);
  expect(result.sendFxHpf).toBe(13);
  expect(result.sendFxLevel).toBe(14);
  expect(result.sendReturn3Source).toBe(15);
  expect(result.sendReturn3Type).toBe(16);
  expect(result.sendReturn3On).toBe(17);
  expect(result.sendReturn3Level).toBe(18);
  expect(result.beatFxFreqHi).toBe(19);
  expect(result.beatFxFreqMid).toBe(20);
  expect(result.beatFxFreqLow).toBe(21);
  expect(result.headphonesPreEq).toBe(22);
  expect(result.headphonesAMix).toBe(23);
  expect(result.headphonesBMix).toBe(24);
  expect(result.boothEqHi).toBe(25);
  expect(result.boothEqLow).toBe(26);
});
