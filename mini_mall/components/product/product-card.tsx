import type { Category, Product } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

type ProductWithCategory = Product & { category?: Category };

/** 商品卡片（Server Component：列表页/首页网格用） */
export function ProductCard({ product }: { product: ProductWithCategory }) {
  return (
    <Link href={`/products/${product.id}`} className="group">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <CardContent className="flex flex-col gap-1 p-3">
          <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
          <p className="text-xs text-muted-foreground">
            {product.category?.name ?? "未分类"}
          </p>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary">
              {formatPrice(product.price)}
            </span>
            {product.stock <= 0 ? (
              <Badge variant="secondary">缺货</Badge>
            ) : product.stock < 10 ? (
              <Badge variant="secondary">仅剩 {product.stock} 件</Badge>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
