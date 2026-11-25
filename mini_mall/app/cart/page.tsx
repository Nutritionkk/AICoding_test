import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { CartItemRow } from "@/components/cart/cart-item-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "购物车",
};

// 需先读会话再渲染（proxy 已拦截未登录，这里是第二层防护）
export const instant = false;

/** 购物车页 */
export default async function CartPage() {
  const user = await requireUser();
  const items = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCents = items.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0
  );
  const totalQuantity = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">购物车</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
          <ShoppingCart className="size-12" />
          <p>购物车还是空的</p>
          <Button asChild>
            <Link href="/products">去逛逛</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品</TableHead>
                    <TableHead className="w-36">数量</TableHead>
                    <TableHead className="w-28 text-right">小计</TableHead>
                    <TableHead className="w-16 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <CartItemRow key={item.id} item={item} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardContent className="flex flex-col gap-3 p-4">
              <p className="text-sm text-muted-foreground">
                共 {totalQuantity} 件商品
              </p>
              <p className="text-sm">
                商品合计：
                <span className="ml-1 text-lg font-semibold text-primary">
                  {formatPrice(totalCents)}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                结算时将按会员等级计算折扣
              </p>
              <Button size="lg" asChild>
                <Link href="/checkout">去结算</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
