// @vitest-environment jsdom
import { render, screen } from "@testing-library/svelte";
import { expect, test, beforeEach } from "vite-plus/test";
import { store } from "$lib/stores.svelte.js";
import TableLayout from "$lib/../components/TableLayout.svelte";
import { resetStore } from "./helpers.js";

beforeEach(() => {
  resetStore();
});

test("TableLayout: 8レイヤーのヘッダーが全て表示される", () => {
  render(TableLayout);
  for (const name of ["L1", "L2", "L3", "L4", "LA", "LB", "LM", "LC"]) {
    expect(screen.getByText(name)).toBeTruthy();
  }
});

test("TableLayout: 全行ラベルが表示される", () => {
  render(TableLayout);
  for (const label of [
    "Status",
    "Name",
    "Artwork",
    "Track Title",
    "Artist",
    "BPM",
    "Speed",
    "Position",
    "Length",
    "Beat",
    "Sync",
    "OnAir",
    "TrackID",
  ]) {
    // PacketLogフィルターと重複するラベルがあるためgetAllByTextを使用する
    expect(screen.getAllByText(label).length).toBeGreaterThanOrEqual(1);
  }
});

test("TableLayout: デフォルトのIDLEステータスが表示される", () => {
  render(TableLayout);
  const cells = screen.getAllByText("IDLE");
  expect(cells.length).toBe(8);
});

test("TableLayout: PLAYINGステータスが反映される", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "Deck A" };
  render(TableLayout);
  expect(screen.getByText("PLAYING")).toBeTruthy();
  expect(screen.getByText("Deck A")).toBeTruthy();
});

test("TableLayout: メトリクスデータが正しくフォーマットされて表示される", () => {
  store.metrics[0] = {
    state: 3,
    syncMaster: 1,
    beatMarker: 2,
    trackLength: 240000,
    currentPosition: 65400,
    speed: 1048576,
    beatNumber: 42,
    bpm: 12800,
    pitchBend: 0,
    trackID: 1,
  };
  render(TableLayout);
  // BPM: 12800/100 = 128.00
  expect(screen.getByText("128.00")).toBeTruthy();
  // Speed: 1048576/1048576*100 = 100.00%
  expect(screen.getByText("100.00%")).toBeTruthy();
  // Position: 65400ms = 01:05.400
  expect(screen.getByText("01:05.400")).toBeTruthy();
  // Length: 240000ms = 04:00.000
  expect(screen.getByText("04:00.000")).toBeTruthy();
  // Beat: 42 [2/4]
  expect(screen.getByText("42 [2/4]")).toBeTruthy();
  // Sync: Master
  expect(screen.getByText("Master")).toBeTruthy();
});

test("TableLayout: メタデータが表示される", () => {
  store.metadata[0] = {
    trackTitle: "Strobe",
    trackArtist: "deadmau5",
    trackKey: 0,
    trackID: 1,
  };
  render(TableLayout);
  expect(screen.getByText("Strobe")).toBeTruthy();
  expect(screen.getByText("deadmau5")).toBeTruthy();
});

test("TableLayout: データなしの場合はハイフンが表示される", () => {
  render(TableLayout);
  // メトリクスもメタデータもnullの場合、BPM/Speed/Title等は全て"-"
  const dashes = screen.getAllByText("-");
  expect(dashes.length).toBeGreaterThan(0);
});

test("TableLayout: artworkがある場合にimg要素が表示される", () => {
  store.artwork[0] = { base64: "dGVzdA==", mimeType: "image/jpeg" };
  render(TableLayout);
  const img = screen.getByAltText("Art");
  expect(img).toBeTruthy();
  expect(img.getAttribute("src")).toContain("data:image/jpeg;base64,dGVzdA==");
});

test("TableLayout: BPM=0のとき'0.00'が表示される", () => {
  store.metrics[0] = {
    state: 0,
    syncMaster: 0,
    beatMarker: 0,
    trackLength: 0,
    currentPosition: 0,
    speed: 0,
    beatNumber: 0,
    bpm: 0,
    pitchBend: 0,
    trackID: 1,
  };
  render(TableLayout);
  expect(screen.getByText("0.00")).toBeTruthy();
});

test("TableLayout: OnAir状態が表示される", () => {
  store.time[0] = {
    currentTimeMillis: 10000,
    totalTimeMillis: 240000,
    beatMarker: 1,
    state: 3,
    onAir: 1,
  };
  render(TableLayout);
  expect(screen.getByText("ON")).toBeTruthy();
});
