import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderStatusBadge } from "@/components/order/order-status-badge";
import { Button } from "@/components/ui/button";
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

export const metadata: Metadata = {
  title: "订单管理",
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "全部状态" },
  { value: "PENDING", label: "待支付" },
  { value: "PAID", label: "已支付" },
  { value: "SHIPPED", label: "已发货" },
  { value: "COMPLETED", label: "已完成" },
  { value: "CANCELLED", label: "已取消" },
];

const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** 订单管理列表（?status= 筛选） */
export default async function OrdersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { status: statusRaw } = await searchParams;
  // 重复 query 参数归一化
  const status = Array.isArray(statusRaw) ? statusRaw[0] : statusRaw;
  const valid = STATUS_OPTIONS.some((o) => o.value === status);
  const filter = valid && status ? (status as OrderStatus) : undefined;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">订单管理</h1>
      <form method="get" className="mb-4 flex items-center gap-2">
        <select name="status" defaultValue={status ?? ""} className={selectClass}>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" size="sm">
          筛选
        </Button>
      </form>
      <Suspense fallback={<div className="h-64" />}>
        <OrdersTable filter={filter} />
      </Suspense>
    </div>
  );
}

async function OrdersTable({ filter }: { filter?: OrderStatus }) {
  const orders = await prisma.order.findMany({
    where: filter ? { status: filter } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } }, items: { select: { id: true, productName: true, quantity: true } } },
  });

  if (orders.length === 0) {
    return <p className="py-12 text-center text-muted-foreground">没有符合条件的订单</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>订单号</TableHead>
          <TableHead>用户</TableHead>
          <TableHead>商品</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="text-right">实付</TableHead>
          <TableHead className="w-24 text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="text-muted-foreground">{o.orderNo}</TableCell>
            <TableCell>{o.user.email}</TableCell>
            <TableCell className="max-w-56">
              <p className="line-clamp-1 text-sm">
                {o.items.map((it) => `${it.productName}×${it.quantity}`).join("、")}
              </p>
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={o.status as OrderStatus} />
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatPrice(o.totalAmount)}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/orders/${o.id}`}>处理</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
