// @vitest-environment jsdom
import { describe, expect, test } from "vite-plus/test";
import { render } from "@testing-library/svelte";
import FpsCounter from "../../src/components/FpsCounter.svelte";

describe("FpsCounter", () => {
  test("FPS カウンター要素をレンダリングする", () => {
    const { getByTestId } = render(FpsCounter);
    const el = getByTestId("fps-counter");
    expect(el).toBeTruthy();
    // 初期は 0 FPS。RAF が動けば更新されるが、初期 DOM テストでは 0 で十分
    expect(el.textContent).toMatch(/\d+\s*FPS/);
  });
});
