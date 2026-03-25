import { expect, test, vi } from "vite-plus/test";
import { WebSocketBroadcaster } from "../../server/utils/broadcaster.js";
import type { WSMessage } from "../../server/types.js";

function createMockWs(open = true) {
  return { readyState: open ? 1 : 3, send: vi.fn() };
}

test("broadcast: メッセージをJSON化して全クライアントに送信する", () => {
  const broadcaster = new WebSocketBroadcaster();
  const ws1 = createMockWs();
  const ws2 = createMockWs();
  broadcaster.addClient(ws1 as any);
  broadcaster.addClient(ws2 as any);

  const msg: WSMessage = { type: "tcnet-status", connected: true, timestamp: 1000 };
  broadcaster.broadcast(msg);

  const expected = JSON.stringify(msg);
  expect(ws1.send).toHaveBeenCalledWith(expected);
  expect(ws2.send).toHaveBeenCalledWith(expected);
});

test("broadcast: OPEN状態でないクライアントには送信しない", () => {
  const broadcaster = new WebSocketBroadcaster();
  const wsOpen = createMockWs(true);
  const wsClosed = createMockWs(false);
  broadcaster.addClient(wsOpen as any);
  broadcaster.addClient(wsClosed as any);

  broadcaster.broadcast({ type: "tcnet-status", connected: true, timestamp: 1000 });

  expect(wsOpen.send).toHaveBeenCalled();
  expect(wsClosed.send).not.toHaveBeenCalled();
});

test("broadcast: メッセージをtype+layerでキャッシュする", () => {
  const broadcaster = new WebSocketBroadcaster();
  const msg: WSMessage = { type: "metrics", timestamp: 1000, layer: 0, data: { bpm: 12800 } };
  broadcaster.broadcast(msg);

  const cache = broadcaster.getCachedState();
  expect(cache.has("metrics-0")).toBe(true);
});

test("broadcast: layerなしメッセージはtypeのみでキャッシュする", () => {
  const broadcaster = new WebSocketBroadcaster();
  const msg: WSMessage = { type: "tcnet-status", connected: true, timestamp: 1000 };
  broadcaster.broadcast(msg);

  expect(broadcaster.getCachedState().has("tcnet-status")).toBe(true);
});

test("removeClient: 削除後は送信対象外になる", () => {
  const broadcaster = new WebSocketBroadcaster();
  const ws = createMockWs();
  broadcaster.addClient(ws as any);
  broadcaster.removeClient(ws as any);

  broadcaster.broadcast({ type: "tcnet-status", connected: true, timestamp: 1000 });
  expect(ws.send).not.toHaveBeenCalled();
});

test("getClientCount: クライアント数を返す", () => {
  const broadcaster = new WebSocketBroadcaster();
  expect(broadcaster.getClientCount()).toBe(0);
  const ws = createMockWs();
  broadcaster.addClient(ws as any);
  expect(broadcaster.getClientCount()).toBe(1);
});

test("sendCachedState: キャッシュ済みメッセージを新規クライアントに送信する", () => {
  const broadcaster = new WebSocketBroadcaster();
  broadcaster.broadcast({ type: "tcnet-status", connected: true, timestamp: 1000 });

  const newWs = createMockWs();
  broadcaster.sendCachedState(newWs as any);
  expect(newWs.send).toHaveBeenCalledTimes(1);
});

test("broadcastServerLog: ANSI除去しフォーマットした文字列を送信する", () => {
  const broadcaster = new WebSocketBroadcaster();
  const ws = createMockWs();
  broadcaster.addClient(ws as any);

  // oxlint-disable-next-line no-control-regex -- ANSI ESCを意図的にマッチさせている
  const mockStripAnsi = (s: string) => s.replace(/\u001b\[.*?m/g, "");
  const mockFormat = (...args: unknown[]) => `\u001b[32m${String(args[0])}\u001b[0m`;

  broadcaster.broadcastServerLog("log", ["hello"], mockStripAnsi, mockFormat);

  expect(ws.send).toHaveBeenCalled();
  const sent = JSON.parse((ws.send as any).mock.calls[0][0]);
  expect(sent.type).toBe("server-log");
  expect(sent.level).toBe("log");
  expect(sent.message).toBe("hello");
});

test("broadcastServerLog: クライアントなしなら何もしない", () => {
  const broadcaster = new WebSocketBroadcaster();
  broadcaster.broadcastServerLog(
    "log",
    ["test"],
    (s) => s,
    (...a) => String(a[0]),
  );
});

test("broadcastServerLog: format失敗時はフォールバックする", () => {
  const broadcaster = new WebSocketBroadcaster();
  const ws = createMockWs();
  broadcaster.addClient(ws as any);

  const throwingFormat = () => {
    throw new Error("format error");
  };

  broadcaster.broadcastServerLog("error", ["fallback"], (s) => s, throwingFormat as any);

  const sent = JSON.parse((ws.send as any).mock.calls[0][0]);
  expect(sent.message).toBe("fallback");
});
