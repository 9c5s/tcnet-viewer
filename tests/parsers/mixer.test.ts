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
});
