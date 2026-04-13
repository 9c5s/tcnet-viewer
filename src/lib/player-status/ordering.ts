/**
 * playerStatusOrder は常に [0, 1, 2, 3] の完全な permutation を持つ。
 * L1-L4 (index 0-3) に対応する。
 */
export const DEFAULT_ORDER: number[] = [0, 1, 2, 3];
const ORDER_LENGTH = 4;

/**
 * 配列が [0..3] の完全な permutation かを判定する。
 */
export function isValidOrder(order: readonly number[]): boolean {
  if (!Array.isArray(order) || order.length !== ORDER_LENGTH) return false;
  const seen = new Set<number>();
  for (const v of order) {
    if (!Number.isInteger(v) || v < 0 || v >= ORDER_LENGTH) return false;
    if (seen.has(v)) return false;
    seen.add(v);
  }
  return true;
}

/**
 * 不正な order を検出したら DEFAULT_ORDER に復元する。
 */
export function normalizeOrder(order: readonly number[]): number[] {
  return isValidOrder(order) ? [...order] : [...DEFAULT_ORDER];
}

/**
 * order を走査し、activeIndexes に含まれる要素のみを順序保持で抽出する。
 */
export function pickActive(order: readonly number[], activeIndexes: ReadonlySet<number>): number[] {
  return order.filter((i) => activeIndexes.has(i));
}

/**
 * DnDで並び替えられた active subset を、完全な order に merge し直す。
 * inactive 位置は不変。不正入力の場合は prevOrder を維持する。
 */
export function mergeDraggedOrder(
  prevOrder: readonly number[],
  activeIndexes: ReadonlySet<number>,
  draggedActive: readonly number[],
): number[] {
  if (!isValidOrder(prevOrder)) return [...DEFAULT_ORDER];

  const activePositions: number[] = [];
  for (let i = 0; i < prevOrder.length; i++) {
    if (activeIndexes.has(prevOrder[i]!)) activePositions.push(i);
  }

  if (activePositions.length !== draggedActive.length) return [...prevOrder];
  const draggedSet = new Set(draggedActive);
  if (draggedSet.size !== draggedActive.length) return [...prevOrder];
  for (const v of draggedActive) {
    if (!activeIndexes.has(v)) return [...prevOrder];
  }

  const newOrder = [...prevOrder];
  for (let i = 0; i < activePositions.length; i++) {
    newOrder[activePositions[i]!] = draggedActive[i]!;
  }
  return isValidOrder(newOrder) ? newOrder : [...prevOrder];
}
