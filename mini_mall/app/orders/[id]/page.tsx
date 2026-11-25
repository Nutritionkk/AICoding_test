import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { OrderActionButtons } from "@/components/order/order-action-buttons";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getNextTier,
  getTierBySpent,
  getUserSpent,
} from "@/lib/membership";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/validations";

// 需先读会话与订单归属再渲染
export const instant = false;

/** 订单详情页：仅订单归属者可查看 */
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order || order.userId !== user.id) {
    notFound();
  }

  // 支付后的会员等级与升级进度
  const spent = await getUserSpent(user.id);
  const tier = getTierBySpent(spent);
  const next = getNextTier(spent);

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleString("zh-CN", { hour12: false }) : null;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">订单详情</h1>
          <p className="mt-1 text-sm text-muted-foreground">{order.orderNo}</p>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} />
      </div>

      <div className="flex flex-col gap-4">
        {/* 操作区（仅待支付） */}
        <OrderActionButtons
          orderId={order.id}
          status={order.status as OrderStatus}
        />

        {/* 会员进度（支付后展示） */}
        {order.status !== "PENDING" && order.status !== "CANCELLED" && (
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">会员等级</CardTitle>
              <Badge variant="secondary">{tier.name}</Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              累计实付 {formatPrice(spent)}
              {next ? (
                <span className="ml-2">
                  · 距 {next.tier.name} 还差 {formatPrice(next.remaining)}
                </span>
              ) : (
                <span className="ml-2">· 已是最高等级</span>
              )}
            </CardContent>
          </Card>
        )}

        {/* 商品明细（快照） */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">商品明细</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead className="w-24 text-right">单价</TableHead>
                  <TableHead className="w-16 text-right">数量</TableHead>
                  <TableHead className="w-28 text-right">小计</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={it.imageUrl}
                            alt={it.productName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <span className="line-clamp-1 text-sm">
                          {it.productName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(it.price)}
                    </TableCell>
                    <TableCell className="text-right">{it.quantity}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(it.price * it.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 金额与收货信息 */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">金额</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品合计</span>
                <span>{formatPrice(order.originalAmount)}</span>
              </div>
              {order.discountRate < 1 && (
                <div className="flex justify-between text-primary">
                  <span>会员优惠（{(order.discountRate * 10).toFixed(1)} 折）</span>
                  <span>-{formatPrice(order.originalAmount - order.totalAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span>实付金额</span>
                <span className="text-lg font-semibold text-primary">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">收货信息</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <p>
                {order.receiverName} · {order.receiverPhone}
              </p>
              <p className="text-muted-foreground">{order.receiverAddress}</p>
              {order.note && (
                <p className="text-muted-foreground">备注：{order.note}</p>
              )}
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                下单时间：{formatDate(order.createdAt)}
              </p>
              {order.paidAt && (
                <p className="text-xs text-muted-foreground">
                  支付时间：{formatDate(order.paidAt)}
                </p>
              )}
              {order.cancelledAt && (
                <p className="text-xs text-muted-foreground">
                  取消时间：{formatDate(order.cancelledAt)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Button variant="outline" asChild>
            <Link href="/orders">返回订单列表</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
