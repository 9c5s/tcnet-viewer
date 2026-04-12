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

// MixerDataはnode-tcnet仕様 (TCNetDataPacketMixer, packet length 270B) と同じ順序
// でフィールドを並べる。既存UIや公開WS APIとの互換性のためフラット構造を維持し、
// セクションコメントで論理グループを示す。
export type MixerData = {
  // 識別情報
  mixerId: number;
  mixerType: number;
  mixerName: string;
  // マスター音量
  masterAudioLevel: number;
  masterFaderLevel: number;
  masterFilter: number;
  // MIC EQ
  micEqHi: number;
  micEqLow: number;
  // リンク/マスター CUE
  linkCueA: number;
  linkCueB: number;
  masterCueA: number;
  masterCueB: number;
  // マスターアイソレータ
  masterIsolatorOn: boolean;
  masterIsolatorHi: number;
  masterIsolatorMid: number;
  masterIsolatorLow: number;
  // カラーフィルタ
  filterHpf: number;
  filterLpf: number;
  filterResonance: number;
  // Send FX
  sendFxEffect: number;
  sendFxExt1: number;
  sendFxExt2: number;
  sendFxMasterMix: number;
  sendFxSizeFeedback: number;
  sendFxTime: number;
  sendFxHpf: number;
  sendFxLevel: number;
  // Send Return 3
  sendReturn3Source: number;
  sendReturn3Type: number;
  sendReturn3On: number;
  sendReturn3Level: number;
  // フェーダーカーブ
  channelFaderCurve: number;
  crossFaderCurve: number;
  crossFader: number;
  // Beat FX
  beatFxOn: boolean;
  beatFxLevelDepth: number;
  beatFxChannelSelect: number;
  beatFxSelect: number;
  beatFxFreqHi: number;
  beatFxFreqMid: number;
  beatFxFreqLow: number;
  // ヘッドフォン
  headphonesPreEq: number;
  headphonesALevel: number;
  headphonesAMix: number;
  headphonesBLevel: number;
  headphonesBMix: number;
  // ブース
  boothLevel: number;
  boothEqHi: number;
  boothEqLow: number;
  // チャンネル (6ch)
  channels: MixerChannel[];
};
