// @vitest-environment jsdom
import { render, screen } from "@testing-library/svelte";
import { expect, test, beforeEach } from "vite-plus/test";
import { store } from "$lib/stores.svelte.js";
import PacketLog from "$lib/../components/PacketLog.svelte";
import { resetStore } from "./helpers.js";

beforeEach(() => {
  resetStore();
});

test("PacketLog: 空のログでPacket Logヘッダーが表示される", () => {
  render(PacketLog);
  expect(screen.getByText("Packet Log")).toBeTruthy();
});

test("PacketLog: ログエントリのタイプとサマリーが表示される", () => {
  store.packetLog.push({
    id: 1,
    timestamp: Date.now(),
    type: "metadata",
    layer: 0,
    summary: "Track loaded: TestSong",
  });
  render(PacketLog);
  expect(screen.getByText("metadata")).toBeTruthy();
  expect(screen.getByText("Track loaded: TestSong")).toBeTruthy();
});

test("PacketLog: レイヤー名が表示される", () => {
  store.packetLog.push(
    { id: 1, timestamp: Date.now(), type: "metrics", layer: 0, summary: "test" },
    { id: 2, timestamp: Date.now(), type: "metrics", layer: 4, summary: "test2" },
  );
  render(PacketLog);
  expect(screen.getByText("L1")).toBeTruthy();
  expect(screen.getByText("LA")).toBeTruthy();
});

test("PacketLog: layer未設定のエントリは'--'と表示される", () => {
  store.packetLog.push({ id: 1, timestamp: Date.now(), type: "server", summary: "connected" });
  render(PacketLog);
  expect(screen.getByText("--")).toBeTruthy();
});

test("PacketLog: フィルタOFFのタイプはログに表示されない", () => {
  store.logFilters["metadata"] = false;
  store.packetLog.push(
    { id: 1, timestamp: Date.now(), type: "metadata", layer: 0, summary: "should be hidden" },
    { id: 2, timestamp: Date.now(), type: "server", summary: "should be visible" },
  );
  render(PacketLog);
  expect(screen.queryByText("should be hidden")).toBeNull();
  expect(screen.getByText("should be visible")).toBeTruthy();
});

test("PacketLog: フィルタチェックボックスが全タイプ分表示される", () => {
  render(PacketLog);
  const checkboxes = screen.getAllByRole("checkbox");
  expect(checkboxes.length).toBe(Object.keys(store.logFilters).length);
});
