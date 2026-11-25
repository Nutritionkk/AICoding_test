import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "商品管理",
};

/** 商品管理列表页（含搜索） */
export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  // 重复 query 参数归一化
  const keyword = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">商品管理</h1>
        <Button asChild>
          <Link href="/admin/products/new">新增商品</Link>
        </Button>
      </div>
      <form method="get" className="mb-4 flex gap-2">
        <Input name="q" defaultValue={keyword} placeholder="按名称搜索..." className="w-64" />
        <Button type="submit" variant="outline" size="sm">
          搜索
        </Button>
      </form>
      <Suspense fallback={<div className="h-64" />}>
        <ProductTable keyword={keyword} />
      </Suspense>
    </div>
  );
}

async function ProductTable({ keyword }: { keyword: string }) {
  const products = await prisma.product.findMany({
    where: keyword ? { name: { contains: keyword } } : undefined,
    orderBy: { id: "desc" },
    include: { category: true },
  });

  if (products.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">没有匹配的商品</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>名称</TableHead>
          <TableHead>分类</TableHead>
          <TableHead className="text-right">价格</TableHead>
          <TableHead className="text-right">库存</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="w-32 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="text-muted-foreground">{p.id}</TableCell>
            <TableCell className="max-w-48">
              <p className="line-clamp-1 font-medium">{p.name}</p>
            </TableCell>
            <TableCell>{p.category.name}</TableCell>
            <TableCell className="text-right">{formatPrice(p.price)}</TableCell>
            <TableCell className="text-right">{p.stock}</TableCell>
            <TableCell>
              {p.isActive ? (
                <Badge variant="secondary">在售</Badge>
              ) : (
                <Badge variant="outline">下架</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/products/${p.id}/edit`}>编辑</Link>
                </Button>
                <DeleteProductButton productId={p.id} productName={p.name} />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
