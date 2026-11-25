import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { OrderError, generateOrderNo } from "../orders";

describe("generateOrderNo（订单号生成）", () => {
  it("格式为 MM-YYYYMMDD-XXXXXX", () => {
    const no = generateOrderNo(new Date("2026-11-25T10:00:00"));
    assert.match(no, /^MM-\d{8}-\d{6}$/);
    assert.equal(no.slice(0, 11), "MM-20261125");
  });

  it("补零：1 月 5 日 → 20260105", () => {
    const no = generateOrderNo(new Date("2026-01-05T00:00:00"));
    assert.equal(no.slice(0, 11), "MM-20260105");
  });

  it("随机后缀为 6 位数字", () => {
    const no = generateOrderNo();
    const suffix = no.split("-")[2];
    assert.match(suffix, /^\d{6}$/);
  });
});

describe("OrderError（业务错误类型）", () => {
  it("是 Error 的子类，message 可读", () => {
    const err = new OrderError("库存不足");
    assert.ok(err instanceof Error);
    assert.equal(err.message, "库存不足");
  });
});
