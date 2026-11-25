import type { Prisma } from "@prisma/client";

/** 每页商品数 */
export const PAGE_SIZE = 12;

/** 排序白名单 */
export const SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

/** 商品列表页搜索参数（searchParams 原始字符串） */
export type ProductSearchParams = {
  q?: string;
  category?: string;
  page?: string;
  sort?: string;
};

/**
 * 解析搜索参数 → Prisma 查询条件。
 * 非法参数一律安全回退（空关键词忽略、非法分类忽略、非法排序/页码回退默认）。
 */
export function buildProductQuery(params: ProductSearchParams): {
  where: Prisma.ProductWhereInput;
  orderBy: Prisma.ProductOrderByWithRelationInput;
  page: number;
} {
  const q = params.q?.trim() ?? "";
  const where: Prisma.ProductWhereInput = { isActive: true };
  if (q) {
    where.name = { contains: q };
  }

  const categoryId = Number(params.category);
  if (Number.isInteger(categoryId) && categoryId > 0) {
    where.categoryId = categoryId;
  }

  const sort = SORT_OPTIONS.includes(params.sort as SortOption)
    ? (params.sort as SortOption)
    : "newest";
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const pageRaw = Number(params.page);
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { where, orderBy, page };
}

/** 页码越界收敛到合法范围（总页数至少为 1） */
export function clampPage(page: number, total: number): number {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(page, totalPages);
}
