import { expect, test, vi, beforeEach, afterEach } from "vite-plus/test";

// localStorage呼び出しをMockしてlocalStorage書き込みエラーを防ぐ
beforeEach(() => {
  const mockStore = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string): string | null => mockStore.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      mockStore.set(key, value);
    },
    removeItem: (key: string): void => {
      mockStore.delete(key);
    },
    clear: (): void => {
      mockStore.clear();
    },
    get length(): number {
      return mockStore.size;
    },
    key: (index: number): string | null => [...mockStore.keys()][index] ?? null,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

async function loadResetStore() {
  const { store, ViewerStore } = await import("$lib/stores.svelte.js");
  store.connected = false;
  store.tcnetConnected = false;
  store.authState = "none";
  store.packetLog.splice(0, store.packetLog.length);
  // hideIdleLayersをデフォルト値に戻す
  store.hideIdleLayers = false;
  // logFiltersをデフォルト値に戻す
  Object.assign(store.logFilters, { ...ViewerStore.DEFAULT_LOG_FILTERS });
  // 全レイヤーデータをリセットする
  store.resetLayerData();
  return store;
}

test("stores: ViewerStoreをimportして初期値を確認する", async () => {
  const store = await loadResetStore();
  expect(store.connected).toBe(false);
  expect(store.tcnetConnected).toBe(false);
  expect(store.layers).toHaveLength(8);
  expect(store.layers[0].status).toBe("IDLE");
});

test("statusIndicator: 未接続時はDisconnectedを返す", async () => {
  const store = await loadResetStore();
  expect(store.statusIndicator).toEqual({ color: "bg-error", text: "Disconnected" });
});

test("statusIndicator: WS接続済みだがBridge未接続はWaitingを返す", async () => {
  const store = await loadResetStore();
  store.connected = true;
  store.tcnetConnected = false;
  expect(store.statusIndicator).toEqual({ color: "bg-warning", text: "Waiting for Bridge..." });
});

test("statusIndicator: 完全接続済みはConnectedを返す", async () => {
  const store = await loadResetStore();
  store.connected = true;
  store.tcnetConnected = true;
  expect(store.statusIndicator).toEqual({ color: "bg-success", text: "Connected" });
});

test("addLogEntry: エントリを追加しIDをインクリメントする", async () => {
  const store = await loadResetStore();
  store.addLogEntry("test", 0, "test entry");
  expect(store.packetLog).toHaveLength(1);
  expect(store.packetLog[0].type).toBe("test");
  expect(store.packetLog[0].summary).toBe("test entry");
});

test("addLogEntry: 5000件を超えると古いエントリを削除する", async () => {
  const store = await loadResetStore();
  for (let i = 0; i < 5010; i++) {
    store.addLogEntry("test", undefined, `entry ${i}`);
  }
  expect(store.packetLog.length).toBe(5000);
});

test("authState: 初期値はnoneである", async () => {
  const store = await loadResetStore();
  expect(store.authState).toBe("none");
});

test("statusIndicator: 接続済み+認証済みはAuthenticatedを返す", async () => {
  const store = await loadResetStore();
  store.connected = true;
  store.tcnetConnected = true;
  store.authState = "authenticated";
  expect(store.statusIndicator).toEqual({ color: "bg-success", text: "Authenticated" });
});

test("statusIndicator: 接続済み+認証なしはConnectedを返す", async () => {
  const store = await loadResetStore();
  store.connected = true;
  store.tcnetConnected = true;
  store.authState = "none";
  expect(store.statusIndicator).toEqual({ color: "bg-success", text: "Connected" });
});

test("statusIndicator: 接続済み+認証失敗はAuth Failedを返す", async () => {
  const store = await loadResetStore();
  store.connected = true;
  store.tcnetConnected = true;
  store.authState = "failed";
  expect(store.statusIndicator).toEqual({ color: "bg-error", text: "Auth Failed" });
});

test("statusIndicator: 接続済み+認証中はAuthenticating...を返す", async () => {
  const store = await loadResetStore();
  store.connected = true;
  store.tcnetConnected = true;
  store.authState = "pending";
  expect(store.statusIndicator).toEqual({ color: "bg-warning", text: "Authenticating..." });
});

test("addLogEntry: フィルタOFFのtypeはログに追加しない", async () => {
  const store = await loadResetStore();
  store.logFilters["time"] = false;
  store.addLogEntry("time", undefined, "should not be logged");
  expect(store.packetLog).toHaveLength(0);
});

test("toggleHideIdleLayers: falseからtrueに切り替わる", async () => {
  const store = await loadResetStore();
  expect(store.hideIdleLayers).toBe(false);
  store.toggleHideIdleLayers();
  expect(store.hideIdleLayers).toBe(true);
});

test("toggleHideIdleLayers: trueからfalseに切り替わる", async () => {
  const store = await loadResetStore();
  store.hideIdleLayers = true;
  store.toggleHideIdleLayers();
  expect(store.hideIdleLayers).toBe(false);
});

test("toggleHideIdleLayers: 切り替え後にlocalStorageへ保存する", async () => {
  const store = await loadResetStore();
  store.toggleHideIdleLayers();
  expect(localStorage.getItem("hideIdleLayers")).toBe("true");
  store.toggleHideIdleLayers();
  expect(localStorage.getItem("hideIdleLayers")).toBe("false");
});

test("toggleLogFilter: 指定キーをtrueからfalseに切り替える", async () => {
  const store = await loadResetStore();
  // metricsはDEFAULT_LOG_FILTERSでtrueである
  expect(store.logFilters["metrics"]).toBe(true);
  store.toggleLogFilter("metrics");
  expect(store.logFilters["metrics"]).toBe(false);
});

test("toggleLogFilter: 指定キーをfalseからtrueに切り替える", async () => {
  const store = await loadResetStore();
  // timeはDEFAULT_LOG_FILTERSでfalseである
  expect(store.logFilters["time"]).toBe(false);
  store.toggleLogFilter("time");
  expect(store.logFilters["time"]).toBe(true);
});

test("toggleLogFilter: 切り替え後にlocalStorageへ保存する", async () => {
  const store = await loadResetStore();
  store.toggleLogFilter("metrics");
  const saved = JSON.parse(localStorage.getItem("logFilters") ?? "{}") as Record<string, boolean>;
  expect(saved["metrics"]).toBe(false);
});

test("toggleLogFilter: 他のキーには影響しない", async () => {
  const store = await loadResetStore();
  const beforeArtwork = store.logFilters["artwork"];
  store.toggleLogFilter("metrics");
  expect(store.logFilters["artwork"]).toBe(beforeArtwork);
});

// resetLayerDataのフィールド別リセット検証 (テーブル駆動)
test.each([
  {
    field: "metadata" as const,
    setup: (store: any) => {
      for (let i = 0; i < 8; i++)
        store.metadata[i] = {
          trackTitle: `Track ${i}`,
          trackArtist: "Artist",
          trackKey: 1,
          trackID: i,
        };
    },
    expected: null,
  },
  {
    field: "artwork" as const,
    setup: (store: any) => {
      for (let i = 0; i < 8; i++) store.artwork[i] = { base64: "data", mimeType: "image/jpeg" };
    },
    expected: null,
  },
  {
    field: "artworkFailed" as const,
    setup: (store: any) => {
      for (let i = 0; i < 8; i++) store.artworkFailed[i] = true;
    },
    expected: false,
  },
  {
    field: "cues" as const,
    setup: (store: any) => {
      for (let i = 0; i < 8; i++)
        store.cues[i] = [{ index: 1, type: 1, inTime: 0, outTime: 0, color: { r: 0, g: 0, b: 0 } }];
    },
    expected: null,
  },
  {
    field: "waveformSmall" as const,
    setup: (store: any) => {
      for (let i = 0; i < 8; i++) store.waveformSmall[i] = [{ level: 100, color: 0 }];
    },
    expected: null,
  },
  {
    field: "waveformBig" as const,
    setup: (store: any) => {
      for (let i = 0; i < 8; i++) store.waveformBig[i] = [{ level: 100, color: 0 }];
    },
    expected: null,
  },
  {
    field: "beatgrid" as const,
    setup: (store: any) => {
      for (let i = 0; i < 8; i++)
        store.beatgrid[i] = [{ beatNumber: 1, beatType: 20, timestampMs: 0 }];
    },
    expected: null,
  },
])("resetLayerData: 全8レイヤーの$fieldをリセットする", async ({ field, setup, expected }) => {
  const store = await loadResetStore();
  setup(store);
  store.resetLayerData();
  for (let i = 0; i < 8; i++) {
    expect((store as any)[field][i]).toStrictEqual(expected);
  }
});
