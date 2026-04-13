// @vitest-environment jsdom
import { beforeAll, describe, expect, test } from "vite-plus/test";
import { render } from "@testing-library/svelte";
import PlayerStatusLayout from "../../../src/components/player-status/PlayerStatusLayout.svelte";
import { store } from "../../../src/lib/stores.svelte.js";

// jsdom で未定義のブラウザAPIを補う (WaveformCanvas が ResizeObserver を使うため)
beforeAll(() => {
  if (!("ResizeObserver" in globalThis)) {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  }
});

function resetStore() {
  for (let i = 0; i < 8; i++) {
    store.layers[i] = { source: 0, status: "IDLE", trackID: 0, name: `L${i + 1}` };
    store.metadata[i] = null;
    store.metrics[i] = null;
    store.time[i] = null;
    store.waveformSmall[i] = null;
    store.waveformBig[i] = null;
    store.cues[i] = null;
    store.beatgrid[i] = null;
    store.artwork[i] = null;
    store.artworkFailed[i] = false;
  }
  store.playerStatusArrange = "stack";
  store.playerStatusZoom = [2, 2, 2, 2];
}

describe("PlayerStatusLayout", () => {
  test("L1-L4全IDLEでエンプティステート", () => {
    resetStore();
    const { getByText } = render(PlayerStatusLayout);
    expect(getByText("No active players")).toBeTruthy();
  });

  test("一部activeならそのカードのみ描画", () => {
    resetStore();
    store.layers[0] = { source: 0, status: "PLAYING", trackID: 42, name: "L1" };
    store.layers[2] = { source: 0, status: "PLAYING", trackID: 43, name: "L3" };
    const { queryAllByTestId } = render(PlayerStatusLayout);
    expect(queryAllByTestId("player-card").length).toBe(2);
  });

  test("カードは L1-L4 の番号順に並ぶ", () => {
    resetStore();
    store.layers[1] = { source: 0, status: "PLAYING", trackID: 43, name: "L2" };
    store.layers[0] = { source: 0, status: "PLAYING", trackID: 42, name: "L1" };
    const { queryAllByTestId } = render(PlayerStatusLayout);
    const cards = queryAllByTestId("player-card");
    expect(cards.length).toBe(2);
    const numbers = cards.map(
      (c) => c.querySelector('[data-testid="player-box"] span:last-child')?.textContent,
    );
    expect(numbers).toEqual(["1", "2"]);
  });

  test("Grid 2プレイヤー時、2列gridで横並び (col-span-2 なし)", () => {
    resetStore();
    store.layers[0] = { source: 0, status: "PLAYING", trackID: 42, name: "L1" };
    store.layers[1] = { source: 0, status: "PLAYING", trackID: 43, name: "L2" };
    store.playerStatusArrange = "grid";
    const { container } = render(PlayerStatusLayout);
    expect(container.querySelector(".grid-cols-2")).toBeTruthy();
    expect(container.querySelectorAll(".col-span-2").length).toBe(0);
  });

  test("Grid 3プレイヤー時、3枚目のwrapperにcol-span-2が付く", () => {
    resetStore();
    store.layers[0] = { source: 0, status: "PLAYING", trackID: 42, name: "L1" };
    store.layers[1] = { source: 0, status: "PLAYING", trackID: 43, name: "L2" };
    store.layers[2] = { source: 0, status: "PLAYING", trackID: 44, name: "L3" };
    store.playerStatusArrange = "grid";
    const { container } = render(PlayerStatusLayout);
    const spans = container.querySelectorAll(".col-span-2");
    expect(spans.length).toBe(1);
  });

  test("Grid 4プレイヤー時、col-span-2 は付かない (2x2)", () => {
    resetStore();
    for (let i = 0; i < 4; i++) {
      store.layers[i] = { source: 0, status: "PLAYING", trackID: 42 + i, name: `L${i + 1}` };
    }
    store.playerStatusArrange = "grid";
    const { container } = render(PlayerStatusLayout);
    const spans = container.querySelectorAll(".col-span-2");
    expect(spans.length).toBe(0);
  });
});
