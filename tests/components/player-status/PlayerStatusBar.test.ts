// @vitest-environment jsdom
import { describe, expect, test } from "vite-plus/test";
import { render } from "@testing-library/svelte";
import PlayerStatusBar from "../../../src/components/player-status/PlayerStatusBar.svelte";
import type { LayerInfo, MetricsData, TimeInfo } from "../../../src/lib/types.js";

const layer: LayerInfo = { source: 0, status: "PLAYING", trackID: 42, name: "L1" };
const time = (onAir: number, ms: number) =>
  ({
    type: 0,
    currentTimeMillis: ms,
    totalTimeMillis: 0,
    remainingTimeMillis: 0,
    onAir,
  }) as unknown as TimeInfo;
const metrics = (over: Partial<MetricsData> = {}): MetricsData => ({
  state: 3,
  syncMaster: 0,
  beatMarker: 1,
  trackLength: 180_000,
  currentPosition: 0,
  speed: 0,
  beatNumber: 0,
  bpm: 12600,
  pitchBend: 0,
  trackID: 42,
  ...over,
});
const sparseMetrics: MetricsData = { trackID: 42 };

describe("PlayerStatusBar", () => {
  test("ON AIR バッジ (onAir=1) は赤枠赤文字", () => {
    const { getByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(1, 0), metrics: metrics() },
    });
    const badge = getByText("ON AIR");
    expect(badge.className).toContain("text-error");
  });
  test("OFF AIR (onAir=0) はmuted表示", () => {
    const { getByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(0, 0), metrics: metrics() },
    });
    expect(getByText("OFF AIR")).toBeTruthy();
  });
  test("Time/Remain を MM:SS.FFF で表示 (.FFF 部分は分割span)", () => {
    const { container } = render(PlayerStatusBar, {
      props: {
        layer,
        playerNumber: 1,
        time: time(1, 30_000),
        metrics: metrics({ trackLength: 180_000 }),
      },
    });
    // 外側span.textContent は分割された子spanも連結されるため MM:SS.FFF として取得できる
    const text = container.textContent ?? "";
    expect(text).toContain("00:30.000");
    expect(text).toContain("02:30.000");
  });
  test("metrics=nullでTime/Remain placeholderを表示", () => {
    const { container } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(1, 30_000), metrics: null },
    });
    const text = container.textContent ?? "";
    const matches = text.match(/--:--\.---/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });
  test("metrics.trackID不一致でBPM/Pitch/Time placeholder", () => {
    const { container, queryByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(1, 30_000), metrics: metrics({ trackID: 99 }) },
    });
    const text = container.textContent ?? "";
    const matches = text.match(/--:--\.---/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(queryByText("126.0")).toBeNull();
  });
  test("MASTER バッジ (syncMaster===playerNumber) 点灯", () => {
    // syncMaster は master deck の player number (1-4) を全layer共通で配信する。
    // このテストでは layer=0 (player 1) で syncMaster=1 なので自身が master
    const { getByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(1, 0), metrics: metrics({ syncMaster: 1 }) },
    });
    const badge = getByText("MASTER");
    expect(badge.className).not.toContain("border-base-content/40");
  });
  test("別deckがMASTER (syncMaster!==playerNumber) の場合は点灯しない", () => {
    // player 2 視点で syncMaster=1 (master は player 1) の場合
    const { getByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 2, time: time(1, 0), metrics: metrics({ syncMaster: 1 }) },
    });
    const badge = getByText("MASTER");
    expect(badge.className).toContain("border-base-content/40");
  });
  test("sparseMetrics (bpm/pitchBend未定義) でBPM/Pitch placeholder", () => {
    const { getAllByText, queryByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(1, 30_000), metrics: sparseMetrics },
    });
    expect(getAllByText("—").length).toBeGreaterThanOrEqual(2);
    expect(queryByText("126.0")).toBeNull();
  });
  test("Pitch (pitchBend=123、100倍スケール) を +1.23% で表示", () => {
    const { getByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(1, 0), metrics: metrics({ pitchBend: 123 }) },
    });
    expect(getByText("+1.23%")).toBeTruthy();
  });
  test("Pitch (pitchBend=-123) は -1.23% で表示する (符号は toFixed 由来)", () => {
    const { getByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(1, 0), metrics: metrics({ pitchBend: -123 }) },
    });
    expect(getByText("-1.23%")).toBeTruthy();
  });
  test("Pitch (pitchBend=0) は 0.00% で表示する (符号なし)", () => {
    const { getByText } = render(PlayerStatusBar, {
      props: { layer, playerNumber: 1, time: time(1, 0), metrics: metrics({ pitchBend: 0 }) },
    });
    expect(getByText("0.00%")).toBeTruthy();
  });
});
