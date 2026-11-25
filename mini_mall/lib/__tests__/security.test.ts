import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeNextPath } from "../auth";
import { isAllowedImageUrl } from "../image-whitelist";
import { firstSearchParam } from "../products";
import { idSchema, quantitySchema, orderStatusSchema } from "../validations";

describe("sanitizeNextPath（登录回跳参数防开放重定向）", () => {
  it("允许站内已知路径", () => {
    assert.equal(sanitizeNextPath("/cart"), "/cart");
    assert.equal(sanitizeNextPath("/orders/3"), "/orders/3");
    assert.equal(sanitizeNextPath("/products?q=x"), "/products?q=x");
    assert.equal(sanitizeNextPath("/checkout"), "/checkout");
  });

  it("非字符串与空值回退首页", () => {
    assert.equal(sanitizeNextPath(undefined), "/");
    assert.equal(sanitizeNextPath(null), "/");
    assert.equal(sanitizeNextPath(""), "/");
    assert.equal(sanitizeNextPath(123), "/");
  });

  it("协议相对地址被拒绝", () => {
    assert.equal(sanitizeNextPath("//evil.com"), "/");
  });

  it("反斜杠规范化攻击被拒绝", () => {
    // 浏览器会把 /\evil.com 规范化为 //evil.com
    assert.equal(sanitizeNextPath("/\\evil.com"), "/");
    assert.equal(sanitizeNextPath("/%5Cevil.com"), "/");
  });

  it("非站内路径被拒绝", () => {
    assert.equal(sanitizeNextPath("https://evil.com"), "/");
    assert.equal(sanitizeNextPath("/somewhere-else"), "/");
  });
});

describe("isAllowedImageUrl（图片域名白名单）", () => {
  it("白名单域名通过", () => {
    assert.equal(isAllowedImageUrl("https://picsum.photos/seed/mm-1/600/600"), true);
    assert.equal(isAllowedImageUrl("https://placehold.co/600x400"), true);
  });

  it("白名单外的域名被拒绝", () => {
    assert.equal(isAllowedImageUrl("https://evil.com/x.jpg"), false);
    assert.equal(isAllowedImageUrl("https://picsum.photos.evil.com/x.jpg"), false);
  });

  it("非 http(s) 协议被拒绝", () => {
    assert.equal(isAllowedImageUrl("ftp://picsum.photos/x.jpg"), false);
    assert.equal(isAllowedImageUrl("javascript:alert(1)"), false);
  });

  it("非法 URL 被拒绝", () => {
    assert.equal(isAllowedImageUrl("not-a-url"), false);
  });
});

describe("firstSearchParam（重复 query 参数归一化）", () => {
  it("字符串原样返回", () => {
    assert.equal(firstSearchParam("耳机"), "耳机");
  });

  it("数组取第一个", () => {
    assert.equal(firstSearchParam(["a", "b"]), "a");
  });

  it("undefined 返回 undefined", () => {
    assert.equal(firstSearchParam(undefined), undefined);
  });
});

describe("参数型 action 的运行时校验 schema", () => {
  it("idSchema：正整数且在 32 位 Int 范围内", () => {
    assert.equal(idSchema.safeParse(1).success, true);
    assert.equal(idSchema.safeParse("3").success, true);
    assert.equal(idSchema.safeParse(0).success, false);
    assert.equal(idSchema.safeParse(-1).success, false);
    assert.equal(idSchema.safeParse(2_147_483_648).success, false);
    assert.equal(idSchema.safeParse(3.5).success, false);
  });

  it("quantitySchema：整数且 ≥ 1，带合理上限", () => {
    assert.equal(quantitySchema.safeParse(1).success, true);
    assert.equal(quantitySchema.safeParse("99").success, true);
    assert.equal(quantitySchema.safeParse(0).success, false);
    assert.equal(quantitySchema.safeParse(-2).success, false);
    assert.equal(quantitySchema.safeParse(1.5).success, false);
    assert.equal(quantitySchema.safeParse(100_001).success, false);
  });

  it("orderStatusSchema：仅接受合法状态", () => {
    assert.equal(orderStatusSchema.safeParse("PAID").success, true);
    assert.equal(orderStatusSchema.safeParse("CANCELLED").success, true);
    assert.equal(orderStatusSchema.safeParse("HACKED").success, false);
    assert.equal(orderStatusSchema.safeParse("paid").success, false);
  });
});
