import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/** 后台仪表盘：核心经营数据统计 */
export default async function AdminDashboardPage() {
  const [productCount, orderCount, salesSum, pendingShip] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "SHIPPED", "COMPLETED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.order.count({ where: { status: "PAID" } }),
  ]);

  const stats = [
    { label: "商品总数", value: String(productCount) },
    { label: "订单总数", value: String(orderCount) },
    { label: "销售额", value: formatPrice(salesSum._sum.totalAmount ?? 0) },
    { label: "待发货", value: String(pendingShip) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">仪表盘</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
