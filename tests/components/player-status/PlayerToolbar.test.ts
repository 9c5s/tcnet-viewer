// @vitest-environment jsdom
import { describe, expect, test, vi } from "vite-plus/test";
import { fireEvent, render } from "@testing-library/svelte";
import PlayerToolbar from "../../../src/components/player-status/PlayerToolbar.svelte";

describe("PlayerToolbar", () => {
  test("Stack/Row/Grid 3ボタンを表示", () => {
    const { getByText } = render(PlayerToolbar, {
      props: { arrangement: "stack", onChange: () => {} },
    });
    expect(getByText("Stack")).toBeTruthy();
    expect(getByText("Row")).toBeTruthy();
    expect(getByText("Grid")).toBeTruthy();
  });
  test("現在のarrangementボタンがaccent表示", () => {
    const { getByText } = render(PlayerToolbar, {
      props: { arrangement: "grid", onChange: () => {} },
    });
    expect(getByText("Grid").className).toContain("btn-primary");
  });
  test("ボタンクリックでonChangeが呼ばれる", async () => {
    const onChange = vi.fn();
    const { getByText } = render(PlayerToolbar, { props: { arrangement: "stack", onChange } });
    await fireEvent.click(getByText("Row"));
    expect(onChange).toHaveBeenCalledWith("row");
  });
});
