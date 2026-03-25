import { expect, test } from "vite-plus/test";
import { statusClass, statusBadgeClass, STATUS_MAP } from "$lib/types.js";
import type { LayerStatus } from "$lib/types.js";

test("statusClass: PLAYINGはtext-successを返す", () => {
  expect(statusClass("PLAYING")).toBe("text-success");
});

test("statusClass: LOOPINGはtext-successを返す", () => {
  expect(statusClass("LOOPING")).toBe("text-success");
});

test("statusClass: PAUSEDはtext-warningを返す", () => {
  expect(statusClass("PAUSED")).toBe("text-warning");
});

test("statusClass: STOPPEDはtext-errorを返す", () => {
  expect(statusClass("STOPPED")).toBe("text-error");
});

test("statusClass: その他のステータスはtext-base-content/40を返す", () => {
  const others: LayerStatus[] = ["IDLE", "CUEDOWN", "PLATTERDOWN", "FFWD", "FFRV", "HOLD"];
  for (const status of others) {
    expect(statusClass(status)).toBe("text-base-content/40");
  }
});

test("statusBadgeClass: PLAYINGはbadge-successを返す", () => {
  expect(statusBadgeClass("PLAYING")).toBe("badge-success");
});

test("statusBadgeClass: LOOPINGはbadge-successを返す", () => {
  expect(statusBadgeClass("LOOPING")).toBe("badge-success");
});

test("statusBadgeClass: PAUSEDはbadge-warningを返す", () => {
  expect(statusBadgeClass("PAUSED")).toBe("badge-warning");
});

test("statusBadgeClass: STOPPEDはbadge-errorを返す", () => {
  expect(statusBadgeClass("STOPPED")).toBe("badge-error");
});

test("statusBadgeClass: その他のステータスは空文字列を返す", () => {
  const others: LayerStatus[] = ["IDLE", "CUEDOWN", "PLATTERDOWN", "FFWD", "FFRV", "HOLD"];
  for (const status of others) {
    expect(statusBadgeClass(status)).toBe("");
  }
});

test("STATUS_MAP: 全ステータスコードがマッピングされている", () => {
  expect(STATUS_MAP[0]).toBe("IDLE");
  expect(STATUS_MAP[3]).toBe("PLAYING");
  expect(STATUS_MAP[4]).toBe("LOOPING");
  expect(STATUS_MAP[5]).toBe("PAUSED");
  expect(STATUS_MAP[6]).toBe("STOPPED");
  expect(STATUS_MAP[11]).toBe("HOLD");
});
