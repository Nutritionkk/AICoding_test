import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
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
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/validations";

/** 管理侧订单详情：状态流转操作（发货/完成/取消退款） */
export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } }, items: true },
  });
  if (!order) {
    notFound();
  }

  const formatDate = (d: Date | null) =>
    d ? d.toLocaleString("zh-CN", { hour12: false }) : null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">订单详情</h1>
          <p className="mt-1 text-sm text-muted-foreground">{order.orderNo}</p>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} />
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">状态操作</CardTitle>
            <AdminOrderActions
              orderId={order.id}
              status={order.status as OrderStatus}
            />
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">商品明细（快照）</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品</TableHead>
                  <TableHead className="text-right">单价</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-right">小计</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{it.productName}</TableCell>
                    <TableCell className="text-right">{formatPrice(it.price)}</TableCell>
                    <TableCell className="text-right">{it.quantity}</TableCell>
                    <TableCell className="text-right">
                      {formatPrice(it.price * it.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
              <div className="flex justify-between">
                <span>实付金额</span>
                <span className="font-semibold text-primary">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">订单信息</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1 text-sm">
              <p>
                用户：{order.user.name}（{order.user.email}）
              </p>
              <p>
                收货：{order.receiverName} · {order.receiverPhone}
              </p>
              <p className="text-muted-foreground">{order.receiverAddress}</p>
              {order.note && (
                <p className="text-muted-foreground">备注：{order.note}</p>
              )}
              <Separator className="my-2" />
              <p className="text-xs text-muted-foreground">
                下单：{formatDate(order.createdAt)}
              </p>
              {order.paidAt && (
                <p className="text-xs text-muted-foreground">
                  支付：{formatDate(order.paidAt)}
                </p>
              )}
              {order.shippedAt && (
                <p className="text-xs text-muted-foreground">
                  发货：{formatDate(order.shippedAt)}
                </p>
              )}
              {order.completedAt && (
                <p className="text-xs text-muted-foreground">
                  完成：{formatDate(order.completedAt)}
                </p>
              )}
              {order.cancelledAt && (
                <p className="text-xs text-muted-foreground">
                  取消：{formatDate(order.cancelledAt)}
                  {order.cancelledReason ? `（${order.cancelledReason}）` : ""}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Button variant="outline" asChild>
            <Link href="/admin/orders">返回订单列表</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
