import { expect, test } from "vite-plus/test";

test("stores: ViewerStoreをimportして初期値を確認する", async () => {
  const { store } = await import("$lib/stores.svelte.js");
  expect(store.connected).toBe(false);
  expect(store.tcnetConnected).toBe(false);
  expect(store.layers).toHaveLength(8);
  expect(store.layers[0].status).toBe("IDLE");
});

test("statusIndicator: 未接続時はDisconnectedを返す", async () => {
  const { store } = await import("$lib/stores.svelte.js");
  store.connected = false;
  expect(store.statusIndicator).toEqual({ color: "bg-error", text: "Disconnected" });
});

test("statusIndicator: WS接続済みだがBridge未接続はWaitingを返す", async () => {
  const { store } = await import("$lib/stores.svelte.js");
  store.connected = true;
  store.tcnetConnected = false;
  expect(store.statusIndicator).toEqual({ color: "bg-warning", text: "Waiting for Bridge..." });
});

test("statusIndicator: 完全接続済みはConnectedを返す", async () => {
  const { store } = await import("$lib/stores.svelte.js");
  store.connected = true;
  store.tcnetConnected = true;
  expect(store.statusIndicator).toEqual({ color: "bg-success", text: "Connected" });
});

test("addLogEntry: エントリを追加しIDをインクリメントする", async () => {
  const { store } = await import("$lib/stores.svelte.js");
  const initialLength = store.packetLog.length;
  store.addLogEntry("test", 0, "test entry");
  expect(store.packetLog.length).toBe(initialLength + 1);
  const entry = store.packetLog[store.packetLog.length - 1];
  expect(entry.type).toBe("test");
  expect(entry.summary).toBe("test entry");
});

test("addLogEntry: 5000件を超えると古いエントリを削除する", async () => {
  const { store } = await import("$lib/stores.svelte.js");
  store.packetLog.splice(0, store.packetLog.length);
  for (let i = 0; i < 5010; i++) {
    store.addLogEntry("test", undefined, `entry ${i}`);
  }
  expect(store.packetLog.length).toBe(5000);
});
