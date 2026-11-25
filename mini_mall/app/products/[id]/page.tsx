import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

// 详情页必须先读 params/DB 才能决定是否 404，
// 声明为阻塞路由（instant = false），保证 404 返回真实状态码
export const instant = false;

/** 商品详情页：无效 id 或商品不存在返回 404 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product || !product.isActive) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{product.category.name}</p>
            <h1 className="mt-1 text-2xl font-semibold">{product.name}</h1>
          </div>
          <p className="text-3xl font-semibold text-primary">
            {formatPrice(product.price)}
          </p>
          <div>
            {product.stock > 0 ? (
              <Badge variant="secondary">现货 {product.stock} 件</Badge>
            ) : (
              <Badge variant="secondary">暂时缺货</Badge>
            )}
          </div>
          <Separator />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>
          <div className="mt-auto flex gap-2">
            {/* 加购按钮在第 10 步实现 */}
            <Button size="lg" disabled={product.stock <= 0}>
              {product.stock > 0 ? "加入购物车" : "暂时缺货"}
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/products">继续逛逛</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
