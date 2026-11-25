import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/validations";

/** 订单状态中文标签 */
const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "待支付",
  PAID: "已支付",
  SHIPPED: "已发货",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

/** 订单状态徽章 */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const variant =
    status === "CANCELLED"
      ? "destructive"
      : status === "COMPLETED"
        ? "default"
        : status === "PAID"
          ? "secondary"
          : status === "PENDING"
            ? "outline"
            : "secondary";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}
