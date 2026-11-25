/**
 * 加购数量合并：当前数量 + 新增数量，上限为库存。
 * 新增数量 ≤ 0 视为非法输入，保持当前数量不变。
 */
export function mergedQuantity(
  current: number,
  added: number,
  stock: number
): number {
  if (added < 1) {
    return current;
  }
  return Math.min(current + added, stock);
}
