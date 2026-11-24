import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatPrice, yuanToCents } from "../utils";

describe("formatPrice（分 → 元字符串）", () => {
  it("零分显示为 ¥0.00", () => {
    assert.equal(formatPrice(0), "¥0.00");
  });

  it("整数元补两位小数", () => {
    assert.equal(formatPrice(100), "¥1.00");
  });

  it("分转元保留两位小数", () => {
    assert.equal(formatPrice(12345), "¥123.45");
  });

  it("不足一元的金额", () => {
    assert.equal(formatPrice(99), "¥0.99");
  });
});

describe("yuanToCents（元 → 分）", () => {
  it("元转分", () => {
    assert.equal(yuanToCents(9.9), 990);
  });

  it("小数第三位四舍五入到分", () => {
    assert.equal(yuanToCents(19.999), 2000);
  });

  it("零元", () => {
    assert.equal(yuanToCents(0), 0);
  });
});
