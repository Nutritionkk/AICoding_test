import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getTierBySpent, getUserSpent } from "@/lib/membership";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/validations";

export const metadata: Metadata = {
  title: "我的订单",
};

// 需先读会话再渲染
export const instant = false;

/** 我的订单列表 */
export default async function OrdersPage() {
  const user = await requireUser();
  const [orders, spent] = await Promise.all([
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { items: { select: { id: true, productName: true, quantity: true } } },
    }),
    getUserSpent(user.id),
  ]);
  const tier = getTierBySpent(spent);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">我的订单</h1>
        <Badge variant="secondary">{tier.name}</Badge>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-24 text-muted-foreground">
          <p>还没有订单</p>
          <Button asChild>
            <Link href="/products">去逛逛</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-normal text-muted-foreground">
                  {order.orderNo}
                </CardTitle>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm">
                  <p className="line-clamp-1">
                    {order.items.map((it) => it.productName).join("、")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    共 {order.items.reduce((s, it) => s + it.quantity, 0)} 件
                    {order.discountRate < 1 && (
                      <span className="ml-2 text-primary">
                        会员 {formatPrice(order.originalAmount - order.totalAmount)} 优惠
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-primary">
                    {formatPrice(order.totalAmount)}
                  </span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders/${order.id}`}>查看详情</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
