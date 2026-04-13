// @vitest-environment jsdom
import { describe, expect, test } from "vite-plus/test";
import { render } from "@testing-library/svelte";
import PlayerHeader from "../../../src/components/player-status/PlayerHeader.svelte";
import type { LayerInfo, MetadataData, MetricsData } from "../../../src/lib/types.js";

const baseLayer: LayerInfo = { source: 0, status: "PLAYING", trackID: 42, name: "L1" };
const baseMetadata = {
  trackArtist: "Sembari",
  trackTitle: "On Me",
  trackKey: 7,
  trackID: 42,
} as unknown as MetadataData;
const baseMetrics = {
  state: 3,
  syncMaster: 0,
  beatMarker: 1,
  trackLength: 334_000,
  currentPosition: 0,
  speed: 0,
  beatNumber: 0,
  bpm: 12600,
  pitchBend: 0,
  trackID: 42,
} as unknown as MetricsData;

describe("PlayerHeader", () => {
  test("metadata整合時はTitle/Artistを表示する", () => {
    const { getByText } = render(PlayerHeader, {
      props: {
        layer: baseLayer,
        playerNumber: 2,
        metadata: baseMetadata,
        metrics: baseMetrics,
        artwork: null,
        artworkFailed: false,
      },
    });
    expect(getByText("On Me")).toBeTruthy();
    expect(getByText("Sembari")).toBeTruthy();
  });
  test("metadata.trackID不一致時はTitle/Artistを—で表示する", () => {
    const { queryByText } = render(PlayerHeader, {
      props: {
        layer: { ...baseLayer, trackID: 99 },
        playerNumber: 2,
        metadata: baseMetadata,
        metrics: baseMetrics,
        artwork: null,
        artworkFailed: false,
      },
    });
    expect(queryByText("On Me")).toBeNull();
    expect(queryByText("Sembari")).toBeNull();
  });
  test("metrics整合時にlength badgeが表示される", () => {
    const { getByText } = render(PlayerHeader, {
      props: {
        layer: baseLayer,
        playerNumber: 2,
        metadata: baseMetadata,
        metrics: baseMetrics,
        artwork: null,
        artworkFailed: false,
      },
    });
    expect(getByText("05:34")).toBeTruthy();
  });
  test("metrics.trackID不一致時はlength badgeが非表示", () => {
    const { queryByText } = render(PlayerHeader, {
      props: {
        layer: baseLayer,
        playerNumber: 2,
        metadata: baseMetadata,
        metrics: { ...baseMetrics, trackID: 99 },
        artwork: null,
        artworkFailed: false,
      },
    });
    expect(queryByText("05:34")).toBeNull();
  });
  test("PLAYING時はPLAYERボックスがaccent", () => {
    const { container } = render(PlayerHeader, {
      props: {
        layer: baseLayer,
        playerNumber: 2,
        metadata: baseMetadata,
        metrics: baseMetrics,
        artwork: null,
        artworkFailed: false,
      },
    });
    const box = container.querySelector('[data-testid="player-box"]');
    expect(box?.className).toContain("text-accent");
  });
  test("IDLE時はPLAYERボックスがmuted", () => {
    const { container } = render(PlayerHeader, {
      props: {
        layer: { ...baseLayer, status: "IDLE" },
        playerNumber: 2,
        metadata: null,
        metrics: null,
        artwork: null,
        artworkFailed: false,
      },
    });
    const box = container.querySelector('[data-testid="player-box"]');
    expect(box?.className).toContain("text-base-content/40");
  });
});
