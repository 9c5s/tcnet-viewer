import { store } from "./stores.svelte.js";
import type {
  LayerInfo,
  MetadataData,
  MetricsData,
  TimeInfo,
  WaveformBar,
  BeatGridEntry,
  CuePoint,
} from "./types.js";

// 擬似乱数で波形バーを生成する。実機の BigWaveform に近い envelope + ノイズ形状を作る
function generateWaveformBars(count: number, seed: number): WaveformBar[] {
  const bars: WaveformBar[] = [];
  for (let i = 0; i < count; i++) {
    const envelope = Math.sin((i / Math.max(count, 1)) * Math.PI * 6) * 0.25 + 0.75;
    const noise = (Math.sin(i * 0.37 + seed * 3.1) + 1) * 0.5;
    const rumble = (Math.sin(i * 0.09 + seed) + 1) * 0.5;
    const level = Math.min(255, Math.max(20, Math.round(envelope * noise * rumble * 255 + 30)));
    const color = Math.round((Math.sin(i * 0.04 + seed * 1.7) + 1) * 0.5 * 200 + 30);
    bars.push({ level, color });
  }
  return bars;
}

function generateBeatGrid(trackLengthMs: number, bpm: number): BeatGridEntry[] {
  const beatMs = 60_000 / bpm;
  const totalBeats = Math.floor(trackLengthMs / beatMs);
  const entries: BeatGridEntry[] = [];
  for (let i = 0; i < totalBeats; i++) {
    // 実機 Bridge の挙動を模倣: 4 拍に 1 つだけ beatType=20 (小節境界)、
    // それ以外は beatType=10 (通常拍)。beatNumber は通し番号。
    entries.push({
      beatNumber: i,
      beatType: i % 4 === 3 ? 20 : 10,
      timestampMs: Math.round(i * beatMs),
    });
  }
  return entries;
}

function generateCues(trackLengthMs: number): CuePoint[] {
  return [
    { index: 0, type: 0, inTime: 0, outTime: 0, color: { r: 0, g: 0, b: 0 } },
    {
      index: 1,
      type: 1,
      inTime: Math.round(trackLengthMs * 0.2),
      outTime: 0,
      color: { r: 255, g: 77, b: 77 },
    },
    {
      index: 2,
      type: 2,
      inTime: Math.round(trackLengthMs * 0.5),
      outTime: 0,
      color: { r: 77, g: 255, b: 120 },
    },
    {
      index: 3,
      type: 3,
      inTime: Math.round(trackLengthMs * 0.75),
      outTime: 0,
      color: { r: 77, g: 180, b: 255 },
    },
  ];
}

// Player Status 画面のデザイン確認用にストアをモックで満たす。
// 実機未接続でも 2 プレイヤー (PLAYING) 分のカードが表示される。
export function seedMockData(): void {
  store.connected = true;
  store.tcnetConnected = true;
  store.authState = "authenticated";
  store.node = {
    nodeName: "MOCK BRIDGE",
    nodeType: 0,
    nodeId: 1,
    nodeCount: 3,
    uptime: 1234,
    vendorName: "Pioneer DJ (mock)",
    appName: "PRO DJ LINK Bridge",
    majorVersion: 1,
    minorVersion: 5,
    protocolVersion: "3.5",
  };

  const L1_LEN = 465_000;
  const L1_POS = 157_000;
  const L1_BPM = 132.0;
  const L2_LEN = 228_000;
  const L2_POS = 159_000;
  const L2_BPM = 172.9;

  const layers: LayerInfo[] = Array.from({ length: 8 }, () => ({
    source: 0,
    status: "IDLE" as const,
    trackID: 0,
    name: "",
  }));
  layers[0] = { source: 1, status: "PLAYING", trackID: 2306, name: "CDJ-3000#1" };
  layers[1] = { source: 2, status: "PLAYING", trackID: 158, name: "CDJ-3000#2" };
  store.layers = layers;

  const metadata: (MetadataData | null)[] = Array.from({ length: 8 }, () => null);
  metadata[0] = {
    trackArtist: "Ryo Watanabe",
    trackTitle: "ショコラ・ティアラ -Before Sunrise Remix-",
    trackKey: 0,
    trackID: 2306,
  };
  metadata[1] = {
    trackArtist: "三船栞子",
    trackTitle: "EMOTION",
    trackKey: 0,
    trackID: 158,
  };
  store.metadata = metadata;

  const metrics: (MetricsData | null)[] = Array.from({ length: 8 }, () => null);
  metrics[0] = {
    state: 3,
    syncMaster: 2,
    beatMarker: 2,
    trackLength: L1_LEN,
    currentPosition: L1_POS,
    speed: 33529,
    beatNumber: 128,
    bpm: Math.round(L1_BPM * 100),
    pitchBend: 232,
    trackID: 2306,
  };
  metrics[1] = {
    state: 3,
    syncMaster: 2,
    beatMarker: 4,
    trackLength: L2_LEN,
    currentPosition: L2_POS,
    speed: 33115,
    beatNumber: 456,
    bpm: Math.round(L2_BPM * 100),
    pitchBend: 106,
    trackID: 158,
  };
  store.metrics = metrics;

  const time: (TimeInfo | null)[] = Array.from({ length: 8 }, () => null);
  time[0] = {
    currentTimeMillis: L1_POS,
    totalTimeMillis: L1_LEN,
    beatMarker: 2,
    state: 3,
    onAir: 1,
  };
  time[1] = {
    currentTimeMillis: L2_POS,
    totalTimeMillis: L2_LEN,
    beatMarker: 4,
    state: 3,
    onAir: 0,
  };
  store.time = time;

  const big1Count = Math.round(L1_LEN / (1000 / 150));
  const big2Count = Math.round(L2_LEN / (1000 / 150));
  const waveformBig: (WaveformBar[] | null)[] = Array.from({ length: 8 }, () => null);
  const waveformSmall: (WaveformBar[] | null)[] = Array.from({ length: 8 }, () => null);
  const beatgrid: (BeatGridEntry[] | null)[] = Array.from({ length: 8 }, () => null);
  const cues: (CuePoint[] | null)[] = Array.from({ length: 8 }, () => null);

  waveformBig[0] = generateWaveformBars(big1Count, 1.0);
  waveformBig[1] = generateWaveformBars(big2Count, 4.2);
  waveformSmall[0] = generateWaveformBars(400, 1.5);
  waveformSmall[1] = generateWaveformBars(400, 4.8);
  beatgrid[0] = generateBeatGrid(L1_LEN, L1_BPM);
  beatgrid[1] = generateBeatGrid(L2_LEN, L2_BPM);
  cues[0] = generateCues(L1_LEN);
  cues[1] = generateCues(L2_LEN);

  store.waveformBig = waveformBig;
  store.waveformSmall = waveformSmall;
  store.beatgrid = beatgrid;
  store.cues = cues;

  store.layoutMode = "player-status";
}

// URL に ?mock を付けてアクセスした場合に有効化する
export function isMockMode(): boolean {
  if (typeof location === "undefined") return false;
  return new URLSearchParams(location.search).has("mock");
}
