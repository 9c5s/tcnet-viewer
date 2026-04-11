// @vitest-environment jsdom
import { render, screen } from "@testing-library/svelte";
import { expect, test, beforeEach } from "vite-plus/test";
import { store } from "$lib/stores.svelte.js";
import CardsLayout from "$lib/../components/CardsLayout.svelte";
import { resetStore } from "./helpers.js";

beforeEach(() => {
  resetStore();
});

test("CardsLayout: 全8レイヤーのカード名が表示される", () => {
  render(CardsLayout);
  for (const name of ["L1", "L2", "L3", "L4", "LA", "LB", "LM", "LC"]) {
    expect(screen.getAllByText(name).length).toBeGreaterThanOrEqual(1);
  }
});

test("CardsLayout: IDLEかつデータなしのレイヤーに'No data'が表示される", () => {
  render(CardsLayout);
  const noDataElements = screen.getAllByText("No data");
  expect(noDataElements.length).toBe(8);
});

test("CardsLayout: hideIdleLayers=trueでIDLEレイヤーが非表示になる", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "" };
  store.hideIdleLayers = true;
  render(CardsLayout);
  // L1(PLAYING)のみ表示される
  expect(screen.getAllByText("L1").length).toBeGreaterThanOrEqual(1);
  expect(screen.queryByText("L2")).toBeNull();
});

test("CardsLayout: ステータスバッジが表示される", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "" };
  store.layers[1] = { source: 0, status: "PAUSED", trackID: 2, name: "" };
  render(CardsLayout);
  expect(screen.getByText("PLAYING")).toBeTruthy();
  expect(screen.getByText("PAUSED")).toBeTruthy();
});

test("CardsLayout: メタデータ (タイトルとアーティスト) が表示される", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "" };
  store.metadata[0] = {
    trackTitle: "Strobe",
    trackArtist: "deadmau5",
    trackKey: 0,
    trackID: 1,
  };
  render(CardsLayout);
  expect(screen.getByText("Strobe")).toBeTruthy();
  expect(screen.getByText("deadmau5")).toBeTruthy();
});

test("CardsLayout: artworkがある場合にimg要素が表示される", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "" };
  store.metadata[0] = {
    trackTitle: "Test",
    trackArtist: "Artist",
    trackKey: 0,
    trackID: 1,
  };
  store.artwork[0] = { base64: "dGVzdA==", mimeType: "image/jpeg" };
  render(CardsLayout);
  const img = screen.getByAltText("Art");
  expect(img).toBeTruthy();
  expect(img.getAttribute("src")).toContain("data:image/jpeg;base64,dGVzdA==");
});

test("CardsLayout: メトリクスのBPMが表示される", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "" };
  store.metrics[0] = {
    state: 3,
    syncMaster: 0,
    beatMarker: 1,
    trackLength: 300000,
    currentPosition: 60000,
    speed: 1048576,
    beatNumber: 10,
    bpm: 14000,
    pitchBend: 0,
    trackID: 1,
  };
  render(CardsLayout);
  // BPM: 14000/100 = 140.00
  expect(screen.getByText("140.00")).toBeTruthy();
});

test("CardsLayout: ON AIR/OFF AIRバッジが表示される", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "" };
  store.time[0] = {
    currentTimeMillis: 10000,
    totalTimeMillis: 300000,
    beatMarker: 1,
    state: 3,
    onAir: 1,
  };
  render(CardsLayout);
  expect(screen.getByText("ON AIR")).toBeTruthy();
});

test("CardsLayout: Syncマスター/スレーブバッジが表示される", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "" };
  store.metrics[0] = {
    state: 3,
    syncMaster: 1,
    beatMarker: 1,
    trackLength: 300000,
    currentPosition: 0,
    speed: 1048576,
    beatNumber: 0,
    bpm: 12800,
    pitchBend: 0,
    trackID: 1,
  };
  render(CardsLayout);
  expect(screen.getByText("MASTER")).toBeTruthy();
});

test("CardsLayout: artworkFailed=trueのときエラーSVGインジケータが表示される", () => {
  store.layers[0] = { source: 0, status: "PLAYING", trackID: 1, name: "" };
  store.metadata[0] = {
    trackTitle: "Test",
    trackArtist: "Artist",
    trackKey: 0,
    trackID: 1,
  };
  store.artwork[0] = null;
  store.artworkFailed[0] = true;
  render(CardsLayout);
  // SVG要素が描画されることを確認する
  const svgElements = document.querySelectorAll("svg");
  expect(svgElements.length).toBeGreaterThanOrEqual(1);
  // エラーカラー (oklch(var(--er))) でstroke属性が設定されたSVGが存在することを確認する
  const errorSvg = Array.from(svgElements).find(
    (svg) => svg.getAttribute("stroke") === "oklch(var(--er))",
  );
  expect(errorSvg).toBeTruthy();
});
