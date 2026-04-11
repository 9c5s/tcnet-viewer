import { expect, test, vi } from "vite-plus/test";
import { WebSocketBroadcaster } from "../../server/utils/broadcaster.js";
import { stripAnsi } from "../../server/utils/ansi.js";
import type { WSMessage } from "../../server/types.js";

const identity = (s: string) => s;
const simpleFormat = (...a: unknown[]) => String(a[0]);

function createBroadcaster() {
  return new WebSocketBroadcaster({ stripAnsi, format: simpleFormat });
}

function createMockWs(open = true) {
  return { readyState: open ? 1 : 3, send: vi.fn() };
}

test("broadcast: メッセージをJSON化して全クライアントに送信する", () => {
  const broadcaster = createBroadcaster();
  const ws1 = createMockWs();
  const ws2 = createMockWs();
  broadcaster.addClient(ws1 as any);
  broadcaster.addClient(ws2 as any);

  const msg: WSMessage = {
    type: "tcnet-status",
    connected: true,
    authState: "none",
    timestamp: 1000,
  };
  broadcaster.broadcast(msg);

  const expected = JSON.stringify(msg);
  expect(ws1.send).toHaveBeenCalledWith(expected);
  expect(ws2.send).toHaveBeenCalledWith(expected);
});

test("broadcast: OPEN状態でないクライアントには送信しない", () => {
  const broadcaster = createBroadcaster();
  const wsOpen = createMockWs(true);
  const wsClosed = createMockWs(false);
  broadcaster.addClient(wsOpen as any);
  broadcaster.addClient(wsClosed as any);

  broadcaster.broadcast({
    type: "tcnet-status",
    connected: true,
    authState: "none",
    timestamp: 1000,
  });

  expect(wsOpen.send).toHaveBeenCalled();
  expect(wsClosed.send).not.toHaveBeenCalled();
});

test("broadcast: メッセージをtype+layerでキャッシュする", () => {
  const broadcaster = createBroadcaster();
  const msg: WSMessage = { type: "metrics", timestamp: 1000, layer: 0, data: { bpm: 12800 } };
  broadcaster.broadcast(msg);

  const cache = broadcaster.getCachedState();
  expect(cache.has("metrics-0")).toBe(true);
});

test("broadcast: layerなしメッセージはtypeのみでキャッシュする", () => {
  const broadcaster = createBroadcaster();
  const msg: WSMessage = {
    type: "tcnet-status",
    connected: true,
    authState: "none",
    timestamp: 1000,
  };
  broadcaster.broadcast(msg);

  expect(broadcaster.getCachedState().has("tcnet-status")).toBe(true);
});

test("removeClient: 削除後は送信対象外になる", () => {
  const broadcaster = createBroadcaster();
  const ws = createMockWs();
  broadcaster.addClient(ws as any);
  broadcaster.removeClient(ws as any);

  broadcaster.broadcast({
    type: "tcnet-status",
    connected: true,
    authState: "none",
    timestamp: 1000,
  });
  expect(ws.send).not.toHaveBeenCalled();
});

test("getClientCount: クライアント数を返す", () => {
  const broadcaster = createBroadcaster();
  expect(broadcaster.getClientCount()).toBe(0);
  const ws = createMockWs();
  broadcaster.addClient(ws as any);
  expect(broadcaster.getClientCount()).toBe(1);
});

test("sendCachedState: キャッシュ済みメッセージを新規クライアントに送信する", () => {
  const broadcaster = createBroadcaster();
  broadcaster.broadcast({
    type: "tcnet-status",
    connected: true,
    authState: "none",
    timestamp: 1000,
  });

  const newWs = createMockWs();
  broadcaster.sendCachedState(newWs as any);
  expect(newWs.send).toHaveBeenCalledTimes(1);
});

test("broadcastServerLog: ANSI除去しフォーマットした文字列を送信する", () => {
  const broadcaster = new WebSocketBroadcaster({
    stripAnsi,
    format: (...args: unknown[]) => `\u001b[32m${String(args[0])}\u001b[0m`,
  });
  const ws = createMockWs();
  broadcaster.addClient(ws as any);

  broadcaster.broadcastServerLog("log", ["hello"]);

  expect(ws.send).toHaveBeenCalled();
  const sent = JSON.parse((ws.send as any).mock.calls[0][0]);
  expect(sent.type).toBe("server-log");
  expect(sent.level).toBe("log");
  expect(sent.message).toBe("hello");
});

test("broadcastServerLog: クライアントなしなら何もしない", () => {
  const broadcaster = createBroadcaster();
  broadcaster.broadcastServerLog("log", ["test"]);
  expect(broadcaster.getCachedState().size).toBe(0);
});

test("broadcastServerLog: format失敗時はフォールバックする", () => {
  const throwingFormat = (): string => {
    throw new Error("format error");
  };
  const broadcaster = new WebSocketBroadcaster({ stripAnsi: identity, format: throwingFormat });
  const ws = createMockWs();
  broadcaster.addClient(ws as any);
  broadcaster.broadcastServerLog("error", ["fallback"]);

  const sent = JSON.parse((ws.send as any).mock.calls[0][0]);
  expect(sent.message).toBe("fallback");
});

test("broadcast: 一過性メッセージはキャッシュしない", () => {
  const broadcaster = createBroadcaster();
  const ws = createMockWs();
  broadcaster.addClient(ws as any);

  broadcaster.broadcast({
    type: "tcnet-error",
    timestamp: 1000,
    data: { errorData: [0xff, 0xff, 0xff] },
  });
  broadcaster.broadcast({
    type: "appdata",
    timestamp: 1000,
    data: { cmd: 1, token: 0x12345678, dest: 0xffff, listenerPort: 65023 },
  });

  expect(broadcaster.getCachedState().has("tcnet-error")).toBe(false);
  expect(broadcaster.getCachedState().has("appdata")).toBe(false);
  // メッセージ自体は送信される
  expect(ws.send).toHaveBeenCalledTimes(2);
});

test("broadcast: artwork-failedはレイヤー別キーでキャッシュする", () => {
  const broadcaster = createBroadcaster();
  broadcaster.broadcast({
    type: "artwork-failed",
    timestamp: 1000,
    layer: 2,
  });
  expect(broadcaster.getCachedState().has("artwork-failed-2")).toBe(true);
});

test("broadcast: layer-resetはartwork-failedキャッシュも削除する", () => {
  const broadcaster = createBroadcaster();
  const ws = createMockWs();
  broadcaster.addClient(ws as any);

  broadcaster.broadcast({
    type: "artwork-failed",
    timestamp: 1000,
    layer: 1,
  });
  expect(broadcaster.getCachedState().has("artwork-failed-1")).toBe(true);

  broadcaster.broadcast({ type: "layer-reset", timestamp: 2000, layer: 1 });
  expect(broadcaster.getCachedState().has("artwork-failed-1")).toBe(false);
});

test("broadcast: artwork成功時にartwork-failedキャッシュを削除する", () => {
  const broadcaster = createBroadcaster();
  broadcaster.broadcast({ type: "artwork-failed", timestamp: 1000, layer: 0 });
  expect(broadcaster.getCachedState().has("artwork-failed-0")).toBe(true);

  broadcaster.broadcast({
    type: "artwork",
    timestamp: 2000,
    layer: 0,
    data: { base64: "data", mimeType: "image/jpeg" },
  });
  expect(broadcaster.getCachedState().has("artwork-0")).toBe(true);
  expect(broadcaster.getCachedState().has("artwork-failed-0")).toBe(false);
});

test("broadcast: artwork-failed時にartworkキャッシュを削除する", () => {
  const broadcaster = createBroadcaster();
  broadcaster.broadcast({
    type: "artwork",
    timestamp: 1000,
    layer: 0,
    data: { base64: "data", mimeType: "image/jpeg" },
  });
  expect(broadcaster.getCachedState().has("artwork-0")).toBe(true);

  broadcaster.broadcast({ type: "artwork-failed", timestamp: 2000, layer: 0 });
  expect(broadcaster.getCachedState().has("artwork-failed-0")).toBe(true);
  expect(broadcaster.getCachedState().has("artwork-0")).toBe(false);
});
