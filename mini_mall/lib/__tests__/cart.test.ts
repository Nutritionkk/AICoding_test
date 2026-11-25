import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mergedQuantity } from "../cart";

describe("mergedQuantity（加购数量合并与库存上限）", () => {
  it("正常累加：2 + 2 在库存 10 内得到 4", () => {
    assert.equal(mergedQuantity(2, 2, 10), 4);
  });

  it("超出库存时收敛到库存上限", () => {
    assert.equal(mergedQuantity(8, 5, 10), 10);
  });

  it("恰好加到库存上限", () => {
    assert.equal(mergedQuantity(5, 5, 10), 10);
  });

  it("新增数量非法（0 或负数）时保持当前数量", () => {
    assert.equal(mergedQuantity(3, 0, 10), 3);
    assert.equal(mergedQuantity(3, -2, 10), 3);
  });

  it("库存为 0 时结果为 0", () => {
    assert.equal(mergedQuantity(0, 1, 0), 0);
    assert.equal(mergedQuantity(2, 1, 0), 0);
  });
});
