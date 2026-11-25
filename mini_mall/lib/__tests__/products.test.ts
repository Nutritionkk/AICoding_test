import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PAGE_SIZE, buildProductQuery, clampPage } from "../products";

describe("buildProductQuery（搜索参数 → 查询条件）", () => {
  it("默认参数：仅筛选在售，按最新排序，第 1 页", () => {
    const { where, orderBy, page } = buildProductQuery({});
    assert.deepEqual(where, { isActive: true });
    assert.deepEqual(orderBy, { createdAt: "desc" });
    assert.equal(page, 1);
  });

  it("关键词写入 name 模糊匹配", () => {
    const { where } = buildProductQuery({ q: "耳机" });
    assert.deepEqual(where, { isActive: true, name: { contains: "耳机" } });
  });

  it("纯空白关键词被忽略", () => {
    const { where } = buildProductQuery({ q: "   " });
    assert.deepEqual(where, { isActive: true });
  });

  it("合法分类 id 写入 categoryId", () => {
    const { where } = buildProductQuery({ category: "3" });
    assert.deepEqual(where, { isActive: true, categoryId: 3 });
  });

  it("非数字分类参数被忽略", () => {
    const { where } = buildProductQuery({ category: "abc" });
    assert.deepEqual(where, { isActive: true });
  });

  it("非正数分类 id 被忽略", () => {
    assert.deepEqual(buildProductQuery({ category: "0" }).where, { isActive: true });
    assert.deepEqual(buildProductQuery({ category: "-1" }).where, { isActive: true });
  });

  it("排序白名单：price_asc / price_desc / 未知值回退最新", () => {
    assert.deepEqual(buildProductQuery({ sort: "price_asc" }).orderBy, { price: "asc" });
    assert.deepEqual(buildProductQuery({ sort: "price_desc" }).orderBy, { price: "desc" });
    assert.deepEqual(buildProductQuery({ sort: "hacked" }).orderBy, { createdAt: "desc" });
  });

  it("页码解析：合法整数生效，非法回退第 1 页", () => {
    assert.equal(buildProductQuery({ page: "2" }).page, 2);
    assert.equal(buildProductQuery({ page: "0" }).page, 1);
    assert.equal(buildProductQuery({ page: "-1" }).page, 1);
    assert.equal(buildProductQuery({ page: "abc" }).page, 1);
  });
});

describe("clampPage（分页越界收敛）", () => {
  it("总数为 0 时仍有第 1 页", () => {
    assert.equal(clampPage(1, 0), 1);
  });

  it("页数超出总页数时收敛到最后一页", () => {
    // 25 条、每页 12 → 共 3 页
    assert.equal(clampPage(5, 25), 3);
    assert.equal(clampPage(3, 25), 3);
  });

  it("页数在合法范围内保持不变", () => {
    assert.equal(clampPage(2, 25), 2);
    assert.equal(clampPage(1, 25), 1);
  });

  it("恰好一页时收敛到第 1 页", () => {
    assert.equal(clampPage(3, PAGE_SIZE), 1);
  });
});
