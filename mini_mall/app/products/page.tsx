import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/product-card";
import { ProductSearchForm } from "@/components/product/product-search-form";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { prisma } from "@/lib/db";
import {
  PAGE_SIZE,
  buildProductQuery,
  clampPage,
  firstSearchParam,
  type ProductSearchParams,
} from "@/lib/products";

export const metadata: Metadata = {
  title: "全部商品",
};

/** 商品列表页（静态壳 + Suspense 内动态查询） */
export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">全部商品</h1>
      <Suspense fallback={<div className="h-32" />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** 搜索/筛选/分页主体：读取 searchParams 与数据库 */
async function ProductList({
  searchParams,
}: {
  searchParams: Promise<ProductSearchParams>;
}) {
  const sp = await searchParams;
  const { where, orderBy, page } = buildProductQuery(sp);

  // 归一化后的当前参数（重复 query 参数取第一个）
  const q = firstSearchParam(sp.q) ?? "";
  const category = firstSearchParam(sp.category) ?? "";
  const sort = firstSearchParam(sp.sort) ?? "newest";

  // 先查总数与分类（并行），页码收敛后再取当前页数据
  const [total, categories] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.category.findMany({ orderBy: { id: "asc" } }),
  ]);
  const currentPage = clampPage(page, total);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { category: true },
  });

  // 分页链接：保留当前搜索/筛选/排序参数
  const buildHref = (p: number) => {
    const usp = new URLSearchParams();
    if (q) usp.set("q", q);
    if (category) usp.set("category", category);
    if (sort) usp.set("sort", sort);
    usp.set("page", String(p));
    return `/products?${usp.toString()}`;
  };

  return (
    <>
      <div className="mb-6">
        <ProductSearchForm
          categories={categories}
          defaultValue={{ q, category, sort }}
        />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-24 text-muted-foreground">
          <p>没有找到匹配的商品</p>
          <p className="text-sm">换个关键词或分类试试</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildHref(Math.max(1, currentPage - 1))}
                aria-disabled={currentPage === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href={buildHref(p)}
                  isActive={p === currentPage}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={buildHref(Math.min(totalPages, currentPage + 1))}
                aria-disabled={currentPage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        共 {total} 件商品 · 第 {currentPage}/{totalPages} 页
      </p>
    </>
  );
}
