export type BeatGridEntry = {
  beatNumber: number;
  beatType: number;
  timestampMs: number;
};

export type CuePoint = {
  index: number;
  type: number;
  inTime: number;
  outTime: number;
  color: { r: number; g: number; b: number };
};

export type CueData = {
  loopInTime: number;
  cues: CuePoint[];
};

export type WaveformBar = {
  level: number;
  color: number;
};

export type WaveformData = {
  bars: WaveformBar[];
};

export type MixerChannel = {
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
  crossFaderAssign: number;
};

export type MixerData = {
  mixerId: number;
  mixerType: number;
  mixerName: string;
  masterAudioLevel: number;
  masterFaderLevel: number;
  masterFilter: number;
  micEqHi: number;
  micEqLow: number;
  linkCueA: number;
  linkCueB: number;
  masterCueA: number;
  masterCueB: number;
  masterIsolatorOn: boolean;
  masterIsolatorHi: number;
  masterIsolatorMid: number;
  masterIsolatorLow: number;
  filterHpf: number;
  filterLpf: number;
  filterResonance: number;
  sendFxEffect: number;
  sendFxExt1: number;
  sendFxExt2: number;
  sendFxMasterMix: number;
  sendFxSizeFeedback: number;
  sendFxTime: number;
  sendFxHpf: number;
  sendFxLevel: number;
  sendReturn3Source: number;
  sendReturn3Type: number;
  sendReturn3On: number;
  sendReturn3Level: number;
  channelFaderCurve: number;
  crossFaderCurve: number;
  crossFader: number;
  beatFxOn: boolean;
  beatFxLevelDepth: number;
  beatFxChannelSelect: number;
  beatFxSelect: number;
  beatFxFreqHi: number;
  beatFxFreqMid: number;
  beatFxFreqLow: number;
  headphonesPreEq: number;
  headphonesALevel: number;
  headphonesAMix: number;
  headphonesBLevel: number;
  headphonesBMix: number;
  boothLevel: number;
  boothEqHi: number;
  boothEqLow: number;
  channels: MixerChannel[];
};
