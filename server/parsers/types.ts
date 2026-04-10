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
  crossfaderAssign: number;
};

export type MixerData = {
  mixerId: number;
  mixerType: number;
  mixerName: string;
  masterAudioLevel: number;
  masterFaderLevel: number;
  masterFilter: number;
  masterIsolatorOn: boolean;
  masterIsolatorHi: number;
  masterIsolatorMid: number;
  masterIsolatorLow: number;
  filterHpf: number;
  filterLpf: number;
  filterResonance: number;
  crossFader: number;
  crossFaderCurve: number;
  channelFaderCurve: number;
  beatFxOn: boolean;
  beatFxSelect: number;
  beatFxLevelDepth: number;
  beatFxChannelSelect: number;
  headphonesALevel: number;
  headphonesBLevel: number;
  boothLevel: number;
  channels: MixerChannel[];
};
