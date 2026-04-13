import { expect, test, vi } from "vite-plus/test";
import {
  createHandlers,
  dispatchMessage,
  type MessageHandlerStore,
} from "$lib/message-handlers.js";
import type { WSMessage } from "$lib/types.js";
import { parseMixerData } from "../../server/parsers/mixer.js";
import { MixerDataBuilder } from "../parsers/builders.js";

function createMockStore(): MessageHandlerStore {
  return {
    node: null,
    tcnetConnected: false,
    authState: "none",
    layers: Array.from({ length: 8 }, () => ({
      source: 0,
      status: "IDLE" as const,
      trackID: 0,
      name: "",
    })),
    time: Array(8).fill(null),
    metrics: Array(8).fill(null),
    metadata: Array(8).fill(null),
    cues: Array(8).fill(null),
    waveformSmall: Array(8).fill(null),
    waveformBig: Array(8).fill(null),
    artwork: Array(8).fill(null),
    artworkFailed: Array(8).fill(false),
    beatgrid: Array(8).fill(null),
    mixer: null,
    generalSMPTEMode: 0,
    addLogEntry: vi.fn(),
  };
}

test("optin: ノード情報をストアに反映する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.optin({
    type: "optin",
    timestamp: 1000,
    data: {
      nodeName: "CDJ-3000",
      nodeType: 1,
      nodeId: 1,
      nodeCount: 2,
      uptime: 3600000,
      vendorName: "Pioneer",
      appName: "CDJ",
      majorVersion: 3,
      minorVersion: 0,
      bugVersion: 0,
      protocolMinorVersion: 1,
      nodeListenerPort: 50000,
    },
  });
  expect(store.node?.nodeName).toBe("CDJ-3000");
  expect(store.node?.protocolVersion).toBe("3.1");
});

test("status: レイヤー情報を更新しSTATUS_MAPで変換する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.status({
    type: "status",
    timestamp: 1000,
    data: {
      nodeCount: 1,
      layers: [{ source: 1, status: 3, trackID: 100, name: "Track" }],
    },
  });
  expect(store.layers[0].status).toBe("PLAYING");
  expect(store.layers[0].trackID).toBe(100);
});

test("status: 未知のステータス値はIDLEにフォールバックする", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.status({
    type: "status",
    timestamp: 1000,
    data: { nodeCount: 1, layers: [{ source: 0, status: 999, trackID: 0, name: "" }] },
  });
  expect(store.layers[0].status).toBe("IDLE");
});

test("status: appSpecificがあるときログ末尾に付加する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.status({
    type: "status",
    timestamp: 1000,
    data: { nodeCount: 2, layers: [], appSpecific: "PRODJLINK BRIDGE" },
  });
  expect(store.addLogEntry).toHaveBeenCalledWith(
    "status",
    undefined,
    'nodes=2 app="PRODJLINK BRIDGE"',
  );
});

test("status: appSpecificが32文字超なら切り詰める", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.status({
    type: "status",
    timestamp: 1000,
    data: { nodeCount: 1, layers: [], appSpecific: "A".repeat(50) },
  });
  expect(store.addLogEntry).toHaveBeenCalledWith(
    "status",
    undefined,
    `nodes=1 app="${"A".repeat(32)}…"`,
  );
});

test.each([
  { smpteMode: 0, state: 0 as const },
  { smpteMode: 1, state: 1 as const },
  { smpteMode: 2, state: 2 as const },
])(
  "time: Timecode(smpteMode=$smpteMode state=$state)をストアに反映しgeneralSMPTEModeを更新する",
  ({ smpteMode, state }) => {
    const store = createMockStore();
    const handlers = createHandlers(store);
    handlers.time({
      type: "time",
      timestamp: 1000,
      data: {
        layers: [
          {
            currentTimeMillis: 1000,
            totalTimeMillis: 300000,
            beatMarker: 1,
            state: 3,
            onAir: 0,
            timecode: { smpteMode, state, hours: 1, minutes: 2, seconds: 3, frames: 24 },
          },
        ],
        generalSMPTEMode: smpteMode,
      },
    });
    expect(store.time[0]?.currentTimeMillis).toBe(1000);
    expect(store.time[0]?.timecode?.smpteMode).toBe(smpteMode);
    expect(store.time[0]?.timecode?.state).toBe(state);
    expect(store.time[0]?.timecode?.hours).toBe(1);
    expect(store.time[0]?.timecode?.frames).toBe(24);
    expect(store.generalSMPTEMode).toBe(smpteMode);
    expect(store.addLogEntry).toHaveBeenCalledWith("time", undefined, `smpte=${smpteMode}`);
  },
);

test("metrics: BPMをストアに反映しログに記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.metrics({
    type: "metrics",
    timestamp: 1000,
    layer: 0,
    data: { bpm: 12800 },
  });
  expect(store.metrics[0]?.bpm).toBe(12800);
  expect(store.addLogEntry).toHaveBeenCalledWith("metrics", 0, "bpm=128.00");
});

test("metrics: BPMがnullならN/Aと表示する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.metrics({
    type: "metrics",
    timestamp: 1000,
    layer: 0,
    data: {},
  });
  expect(store.addLogEntry).toHaveBeenCalledWith("metrics", 0, "bpm=N/A");
});

test("metadata: トラック情報をストアに反映する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.metadata({
    type: "metadata",
    timestamp: 1000,
    layer: 2,
    data: { trackArtist: "Artist", trackTitle: "Title", trackKey: 1, trackID: 50 },
  });
  expect(store.metadata[2]?.trackTitle).toBe("Title");
});

test("optout: ノード離脱をログに記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.optout({
    type: "optout",
    timestamp: 1000,
    data: { nodeCount: 1 },
  });
  expect(store.addLogEntry).toHaveBeenCalledWith("optout", undefined, "node left");
});

test("cue: cueポイントをレイヤー別にストアに反映する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  const cues = [
    { index: 1, type: 2, inTime: 1000, outTime: 2000, color: { r: 255, g: 0, b: 0 } },
    { index: 2, type: 0, inTime: 3000, outTime: 0, color: { r: 0, g: 255, b: 0 } },
  ];
  handlers.cue({
    type: "cue",
    timestamp: 1000,
    layer: 3,
    data: { loopInTime: 500, cues },
  });
  expect(store.cues[3]).toBe(cues);
  expect(store.addLogEntry).toHaveBeenCalledWith("cue", 3, "2 cues");
});

test("waveform-small: barsをレイヤー別に反映しログに本数を記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  const bars = [
    { color: 1, level: 10 },
    { color: 2, level: 20 },
  ];
  handlers["waveform-small"]({
    type: "waveform-small",
    timestamp: 1000,
    layer: 0,
    data: { bars },
  });
  expect(store.waveformSmall[0]).toBe(bars);
  expect(store.addLogEntry).toHaveBeenCalledWith("waveform-small", 0, "2 bars");
});

test("waveform-big: barsを正規化してレイヤー別に反映しログに本数を記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  // Bridge (BRIDGE64) は low dynamic range で返すため受信時に 0-255 へ正規化される。
  // max level=50 の場合 scale=255/50、level 50 → 255 に拡大される
  const bars = [{ color: 5, level: 50 }];
  handlers["waveform-big"]({
    type: "waveform-big",
    timestamp: 1000,
    layer: 5,
    data: { bars },
  });
  expect(store.waveformBig[5]).toEqual([{ color: 5, level: 255 }]);
  expect(store.addLogEntry).toHaveBeenCalledWith("waveform-big", 5, "1 bars");
});

test("waveform-big: max level が既に 255 の場合は正規化せず元の参照を保つ", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  const bars = [
    { color: 10, level: 255 },
    { color: 20, level: 128 },
  ];
  handlers["waveform-big"]({
    type: "waveform-big",
    timestamp: 1000,
    layer: 0,
    data: { bars },
  });
  expect(store.waveformBig[0]).toBe(bars);
});

test("waveform-big: 全ゼロ bars は正規化せず元の参照を保つ", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  const bars = [
    { color: 0, level: 0 },
    { color: 0, level: 0 },
  ];
  handlers["waveform-big"]({
    type: "waveform-big",
    timestamp: 1000,
    layer: 0,
    data: { bars },
  });
  expect(store.waveformBig[0]).toBe(bars);
});

test("mixer: MixerDataをストアに反映しmasterAudioLevelをログに記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  // MixerDataBuilder + parseMixerData で47フィールド全てを既定値で埋めたMixerDataを作り、
  // masterAudioLevelだけ検証対象の値にセットする。unknown as キャストで型契約を
  // 回避するのではなく、実際に生成されたMixerDataで契約を満たす
  const mixerData = parseMixerData(new MixerDataBuilder().setMasterLevels(180, 0).build());
  handlers.mixer({
    type: "mixer",
    timestamp: 1000,
    data: mixerData,
  });
  expect(store.mixer).toBe(mixerData);
  expect(store.addLogEntry).toHaveBeenCalledWith("mixer", undefined, "master=180");
});

test("beatgrid: entriesをレイヤー別に反映しログに件数を記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  const entries = [
    { beatNumber: 1, beatType: 20, timestampMs: 0 },
    { beatNumber: 2, beatType: 0, timestampMs: 500 },
    { beatNumber: 3, beatType: 0, timestampMs: 1000 },
  ];
  handlers.beatgrid({
    type: "beatgrid",
    timestamp: 1000,
    layer: 4,
    data: { entries },
  });
  expect(store.beatgrid[4]).toBe(entries);
  expect(store.addLogEntry).toHaveBeenCalledWith("beatgrid", 4, "3 beats");
});

test("tcnet-status: 接続状態を更新する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers["tcnet-status"]({
    type: "tcnet-status",
    connected: true,
    authState: "none",
    timestamp: 1000,
  });
  expect(store.tcnetConnected).toBe(true);
});

test("server-log: レベルを大文字でログに記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers["server-log"]({ type: "server-log", timestamp: 1000, level: "warn", message: "test" });
  expect(store.addLogEntry).toHaveBeenCalledWith("server", undefined, "[WARN] test");
});

test("dispatchMessage: 型に応じたハンドラを呼び出す", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  const msg: WSMessage = {
    type: "tcnet-status",
    connected: true,
    authState: "none",
    timestamp: 1000,
  };
  dispatchMessage(msg, handlers);
  expect(store.tcnetConnected).toBe(true);
});

test("tcnet-status: authStateをストアに反映する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers["tcnet-status"]({
    type: "tcnet-status",
    connected: true,
    authState: "authenticated",
    timestamp: 1000,
  });
  expect(store.tcnetConnected).toBe(true);
  expect(store.authState).toBe("authenticated");
});

test("tcnet-error: ログに構造化フィールドを記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers["tcnet-error"]({
    type: "tcnet-error",
    timestamp: 1000,
    data: { dataType: 0x04, layerId: 1, code: 13, messageType: 0x0003 },
  });
  expect(store.addLogEntry).toHaveBeenCalledWith(
    "tcnet-error",
    undefined,
    "code=13 layer=1 dataType=0x04 messageType=0x0003",
  );
});

test("artwork: base64とmimeTypeをストアに反映する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.artwork({
    type: "artwork",
    timestamp: 1000,
    layer: 2,
    data: { base64: "AQID", mimeType: "image/jpeg" },
  });
  expect(store.artwork[2]).toEqual({ base64: "AQID", mimeType: "image/jpeg" });
  expect(store.addLogEntry).toHaveBeenCalledWith("artwork", 2, "0KB image/jpeg");
});

test("artwork: 他レイヤーのデータは影響しない", () => {
  const store = createMockStore();
  store.artwork[0] = { base64: "existing", mimeType: "image/png" };
  const handlers = createHandlers(store);
  handlers.artwork({
    type: "artwork",
    timestamp: 1000,
    layer: 3,
    data: { base64: "new", mimeType: "image/jpeg" },
  });
  expect(store.artwork[0]).toEqual({ base64: "existing", mimeType: "image/png" });
  expect(store.artwork[3]).toEqual({ base64: "new", mimeType: "image/jpeg" });
});

test("layer-reset: アートワークとCUE/波形/ビートグリッドをクリアする", () => {
  const store = createMockStore();
  store.artwork[1] = { base64: "data", mimeType: "image/jpeg" };
  store.cues[1] = [{ index: 1, type: 1, inTime: 0, outTime: 0, color: { r: 0, g: 0, b: 0 } }];
  store.waveformSmall[1] = [{ level: 100, color: 0 }];
  store.waveformBig[1] = [{ level: 100, color: 0 }];
  store.beatgrid[1] = [{ beatNumber: 1, beatType: 20, timestampMs: 0 }];
  const handlers = createHandlers(store);
  handlers["layer-reset"]({ type: "layer-reset", timestamp: 1000, layer: 1 });
  expect(store.artwork[1]).toBeNull();
  expect(store.cues[1]).toBeNull();
  expect(store.waveformSmall[1]).toBeNull();
  expect(store.waveformBig[1]).toBeNull();
  expect(store.beatgrid[1]).toBeNull();
});

test("layer-reset: metadataはクリアしない", () => {
  const store = createMockStore();
  store.metadata[0] = { trackTitle: "Test", trackArtist: "Artist", trackKey: 1, trackID: 50 };
  const handlers = createHandlers(store);
  handlers["layer-reset"]({ type: "layer-reset", timestamp: 1000, layer: 0 });
  expect(store.metadata[0]).not.toBeNull();
  expect(store.metadata[0]?.trackTitle).toBe("Test");
});

test("appdata: ログにcmd, token, dest, portを記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers["appdata"]({
    type: "appdata",
    timestamp: 1000,
    data: { cmd: 1, token: 0x12345678, dest: 0xffff, listenerPort: 65023 },
  });
  expect(store.addLogEntry).toHaveBeenCalledWith(
    "appdata",
    undefined,
    "cmd=1 token=0x12345678 dest=0xffff port=65023",
  );
});

test("dispatchMessage: 未知のメッセージ型は警告を出す", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  dispatchMessage({ type: "unknown-type" } as unknown as WSMessage, handlers);
  expect(warnSpy).toHaveBeenCalledWith("[WS] 未処理のメッセージ型:", expect.anything());
  warnSpy.mockRestore();
});

test("artwork-failed: artworkFailedフラグをtrueにしartworkをnullにしログに記録する", () => {
  const store = createMockStore();
  store.artwork[2] = { base64: "old", mimeType: "image/jpeg" };
  const handlers = createHandlers(store);
  handlers["artwork-failed"]({
    type: "artwork-failed",
    timestamp: 1000,
    layer: 2,
  });
  expect(store.artworkFailed[2]).toBe(true);
  expect(store.artwork[2]).toBeNull();
  expect(store.artworkFailed[0]).toBe(false);
  expect(store.addLogEntry).toHaveBeenCalledWith("artwork-failed", 2, "artwork fetch failed");
});

test("artwork: artworkFailedフラグをfalseにクリアする", () => {
  const store = createMockStore();
  store.artworkFailed[1] = true;
  const handlers = createHandlers(store);
  handlers.artwork({
    type: "artwork",
    timestamp: 1000,
    layer: 1,
    data: { base64: "AQID", mimeType: "image/jpeg" },
  });
  expect(store.artworkFailed[1]).toBe(false);
});

test("layer-reset: artworkFailedフラグをfalseにクリアする", () => {
  const store = createMockStore();
  store.artworkFailed[1] = true;
  const handlers = createHandlers(store);
  handlers["layer-reset"]({ type: "layer-reset", timestamp: 1000, layer: 1 });
  expect(store.artworkFailed[1]).toBe(false);
});

test("layer-reset: metricsとtimeもnullクリアする", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers.metrics({
    type: "metrics",
    timestamp: 0,
    layer: 2,
    data: {
      state: 3,
      syncMaster: 0,
      beatMarker: 1,
      trackLength: 180_000,
      currentPosition: 0,
      speed: 0,
      beatNumber: 0,
      bpm: 12000,
      pitchBend: 0,
      trackID: 42,
    },
  });
  handlers.time({
    type: "time",
    timestamp: 0,
    data: {
      layers: Array.from({ length: 8 }, (_, i) =>
        i === 2
          ? { currentTimeMillis: 30_000, totalTimeMillis: 0, beatMarker: 1, state: 3, onAir: 1 }
          : { currentTimeMillis: 0, totalTimeMillis: 0, beatMarker: 0, state: 0, onAir: 0 },
      ),
      generalSMPTEMode: 0,
    },
  });
  expect(store.metrics[2]?.trackID).toBe(42);
  expect(store.time[2]?.currentTimeMillis).toBe(30_000);

  handlers["layer-reset"]({ type: "layer-reset", timestamp: 0, layer: 2 });

  expect(store.metrics[2]).toBeNull();
  expect(store.time[2]).toBeNull();
});

test("race回帰: layer-reset後にmetrics先着・time未着でtimeはnullのまま", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);

  handlers.time({
    type: "time",
    timestamp: 0,
    data: {
      layers: Array.from({ length: 8 }, (_, i) =>
        i === 2
          ? { currentTimeMillis: 100_000, totalTimeMillis: 0, beatMarker: 1, state: 3, onAir: 1 }
          : { currentTimeMillis: 0, totalTimeMillis: 0, beatMarker: 0, state: 0, onAir: 0 },
      ),
      generalSMPTEMode: 0,
    },
  });

  handlers["layer-reset"]({ type: "layer-reset", timestamp: 0, layer: 2 });
  handlers.metrics({
    type: "metrics",
    timestamp: 0,
    layer: 2,
    data: {
      state: 3,
      syncMaster: 0,
      beatMarker: 1,
      trackLength: 240_000,
      currentPosition: 0,
      speed: 0,
      beatNumber: 0,
      bpm: 13000,
      pitchBend: 0,
      trackID: 99,
    },
  });

  expect(store.metrics[2]?.trackID).toBe(99);
  expect(store.time[2]).toBeNull();
});
