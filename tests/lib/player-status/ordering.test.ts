import { describe, expect, test } from "vite-plus/test";
import {
  DEFAULT_ORDER,
  isValidOrder,
  normalizeOrder,
  pickActive,
  mergeDraggedOrder,
} from "../../../src/lib/player-status/ordering.js";

describe("isValidOrder", () => {
  test("[0,1,2,3] は valid", () => {
    expect(isValidOrder([0, 1, 2, 3])).toBe(true);
  });
  test("permutation [2,0,1,3] は valid", () => {
    expect(isValidOrder([2, 0, 1, 3])).toBe(true);
  });
  test("長さ違いは invalid", () => {
    expect(isValidOrder([0, 1, 2])).toBe(false);
  });
  test("重複は invalid", () => {
    expect(isValidOrder([0, 0, 1, 2])).toBe(false);
  });
  test("範囲外は invalid", () => {
    expect(isValidOrder([0, 1, 2, 4])).toBe(false);
  });
});

describe("normalizeOrder", () => {
  test("正常な入力はそのまま返す", () => {
    expect(normalizeOrder([2, 0, 1, 3])).toEqual([2, 0, 1, 3]);
  });
  test("不正な入力はDEFAULT_ORDERに復元", () => {
    expect(normalizeOrder([0, 0, 1, 2])).toEqual(DEFAULT_ORDER);
    expect(normalizeOrder([])).toEqual(DEFAULT_ORDER);
  });
});

describe("pickActive", () => {
  test("activeのみをorder順で返す", () => {
    expect(pickActive([2, 0, 1, 3], new Set([0, 1, 2]))).toEqual([2, 0, 1]);
  });
  test("全inactiveなら空配列", () => {
    expect(pickActive([0, 1, 2, 3], new Set())).toEqual([]);
  });
  test("元の相対順序を保つ", () => {
    expect(pickActive([3, 2, 1, 0], new Set([0, 2]))).toEqual([2, 0]);
  });
});

describe("mergeDraggedOrder", () => {
  test("active部分のみ並び替え、inactive位置は不変", () => {
    const out = mergeDraggedOrder([0, 2, 1, 3], new Set([0, 1, 2]), [2, 0, 1]);
    expect(out).toEqual([2, 0, 1, 3]);
  });
  test("inactive位置がprevOrderの中央にある場合", () => {
    const out = mergeDraggedOrder([0, 2, 1, 3], new Set([0, 3]), [3, 0]);
    expect(out).toEqual([3, 2, 1, 0]);
  });
  test("不正なdraggedActive長でprevOrderを維持", () => {
    expect(mergeDraggedOrder([0, 1, 2, 3], new Set([0, 1]), [0, 1, 2])).toEqual([0, 1, 2, 3]);
  });
  test("不正なdraggedActive (重複) でprevOrderを維持", () => {
    expect(mergeDraggedOrder([0, 1, 2, 3], new Set([0, 1, 2]), [0, 0, 1])).toEqual([0, 1, 2, 3]);
  });
});
