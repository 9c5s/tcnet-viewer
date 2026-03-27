import { expect, test, vi } from "vite-plus/test";
import {
  createHandlers,
  dispatchMessage,
  type MessageHandlerStore,
} from "$lib/message-handlers.js";
import type { WSMessage } from "$lib/types.js";

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

test("tcnet-error: ログにerrorDataのサイズを記録する", () => {
  const store = createMockStore();
  const handlers = createHandlers(store);
  handlers["tcnet-error"]({
    type: "tcnet-error",
    timestamp: 1000,
    data: { errorData: [0xff, 0xff, 0xff] },
  });
  expect(store.addLogEntry).toHaveBeenCalledWith("tcnet-error", undefined, "3 bytes");
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
