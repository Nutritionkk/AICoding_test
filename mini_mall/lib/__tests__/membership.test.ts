import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { applyDiscount, getNextTier, getTierBySpent } from "../membership";

describe("getTierBySpent（累计实付 → 会员等级）", () => {
  it("0 分或负数为普通会员，无折扣", () => {
    const tier = getTierBySpent(0);
    assert.equal(tier.name, "普通会员");
    assert.equal(tier.discountRate, 1);
    assert.equal(getTierBySpent(-100).name, "普通会员");
  });

  it("恰好 8000 元（800000 分）升心级1，9.8 折", () => {
    const tier = getTierBySpent(800000);
    assert.equal(tier.name, "心级1");
    assert.equal(tier.discountRate, 0.98);
  });

  it("差 1 分未到心级1 门槛仍为普通会员", () => {
    assert.equal(getTierBySpent(799999).name, "普通会员");
  });

  it("恰好 80000 元升心级2，9.5 折", () => {
    const tier = getTierBySpent(8_000_000);
    assert.equal(tier.name, "心级2");
    assert.equal(tier.discountRate, 0.95);
  });

  it("恰好 800000 元升心级3，9 折", () => {
    const tier = getTierBySpent(80_000_000);
    assert.equal(tier.name, "心级3");
    assert.equal(tier.discountRate, 0.9);
  });

  it("远超心级3 门槛仍为心级3", () => {
    assert.equal(getTierBySpent(1_000_000_000).name, "心级3");
  });
});

describe("getNextTier（下一等级与差距）", () => {
  it("从 0 分到心级1 还差 800000 分", () => {
    const next = getNextTier(0);
    assert.equal(next?.tier.name, "心级1");
    assert.equal(next?.remaining, 800000);
  });

  it("从心级1 到心级2 还差 7200000 分", () => {
    const next = getNextTier(800000);
    assert.equal(next?.tier.name, "心级2");
    assert.equal(next?.remaining, 7_200_000);
  });

  it("中途差距按实际差额计算", () => {
    assert.equal(getNextTier(500000)?.remaining, 300000);
  });

  it("已是最高级返回 null", () => {
    assert.equal(getNextTier(80_000_000), null);
    assert.equal(getNextTier(1_000_000_000), null);
  });
});

describe("applyDiscount（折扣计算，四舍五入到分）", () => {
  it("整数结果", () => {
    assert.equal(applyDiscount(10000, 0.98), 9800);
  });

  it("小数第三位四舍五入", () => {
    // 9999 × 0.98 = 9799.02 → 9799
    assert.equal(applyDiscount(9999, 0.98), 9799);
    // 10000 × 0.95 = 9500
    assert.equal(applyDiscount(10000, 0.95), 9500);
  });

  it("极小金额四舍五入后不为 0", () => {
    // 1 × 0.9 = 0.9 → 1
    assert.equal(applyDiscount(1, 0.9), 1);
  });

  it("无折扣（1）时金额不变", () => {
    assert.equal(applyDiscount(12345, 1), 12345);
  });
});
