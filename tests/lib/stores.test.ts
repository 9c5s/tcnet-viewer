import { expect, test } from "vite-plus/test";

async function loadResetStore() {
  const { store } = await import("$lib/stores.svelte.js");
  store.connected = false;
  store.tcnetConnected = false;
  store.packetLog.splice(0, store.packetLog.length);
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
