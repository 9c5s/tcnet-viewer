// @vitest-environment jsdom
import { describe, expect, test } from "vite-plus/test";
import { render } from "@testing-library/svelte";
import PlayerCard from "../../../src/components/player-status/PlayerCard.svelte";
import type { LayerInfo } from "../../../src/lib/types.js";

const layer: LayerInfo = { source: 0, status: "PLAYING", trackID: 42, name: "L1" };

describe("PlayerCard", () => {
  test("4セクション (Header/Zoom/Status/Full) が描画される", () => {
    const { container } = render(PlayerCard, {
      props: {
        layer,
        layerIndex: 0,
        playerNumber: 1,
        metadata: null,
        metrics: null,
        time: null,
        artwork: null,
        artworkFailed: false,
        waveformBig: null,
        waveformSmall: null,
        cues: null,
        beatgrid: null,
        zoomScale: 8,
        onZoomChange: () => {},
      },
    });
    expect(container.querySelector('[data-testid="player-header"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="player-zoom"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="player-status-bar"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="player-full"]')).toBeTruthy();
  });
});
