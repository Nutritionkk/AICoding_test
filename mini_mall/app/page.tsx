import Link from "next/link";
import { Suspense } from "react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

/** 首页（静态壳 + 动态内容流式渲染） */
export default function HomePage() {
  return (
    <main className="flex-1">
      {/* Hero 区（静态） */}
      <section className="border-b bg-muted/40 py-16 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Mini Mall</h1>
        <p className="mt-2 text-muted-foreground">微型电商 · Next.js 16 全栈练习项目</p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/products">逛逛全部商品</Link>
          </Button>
        </div>
      </section>
      <Suspense fallback={<div className="h-96" />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

/** 首页动态内容：分类入口 + 最新上架（读取数据库，Suspense 内流式渲染） */
async function HomeContent() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { category: true },
    }),
  ]);

  return (
    <>
      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <h2 className="mb-4 text-lg font-semibold">商品分类</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Button key={c.id} variant="outline" asChild>
              <Link href={`/products?category=${c.id}`}>{c.name}</Link>
            </Button>
          ))}
        </div>
      </section>
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <h2 className="mb-4 text-lg font-semibold">最新上架</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}
