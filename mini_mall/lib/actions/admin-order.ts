"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrderError } from "@/lib/orders";
import {
  idSchema,
  isValidTransition,
  orderStatusSchema,
  reasonSchema,
  type OrderStatus,
} from "@/lib/validations";

/** 管理侧订单操作结果 */
export type AdminOrderActionResult = {
  success: boolean;
  error?: string;
};

/** 状态流转对应的订单时间戳字段 */
function timestampField(status: OrderStatus): string | null {
  switch (status) {
    case "PAID":
      return "paidAt";
    case "SHIPPED":
      return "shippedAt";
    case "COMPLETED":
      return "completedAt";
    case "CANCELLED":
      return "cancelledAt";
    default:
      return null;
  }
}

/**
 * 管理侧订单状态流转：发货 / 确认完成 / 取消（含退款，回补库存）。
 * 白名单校验 + updateMany 状态条件更新防并发；进入 CANCELLED 回补库存。
 */
export async function updateOrderStatus(
  orderId: number,
  toStatus: OrderStatus,
  reason?: string
): Promise<AdminOrderActionResult> {
  await requireAdmin();

  // 运行时校验参数（TS 类型不能替代）
  const idParsed = idSchema.safeParse(orderId);
  if (!idParsed.success) {
    return { success: false, error: "订单参数无效" };
  }
  const statusParsed = orderStatusSchema.safeParse(toStatus);
  if (!statusParsed.success) {
    return { success: false, error: "目标状态无效" };
  }
  const reasonParsed = reasonSchema.safeParse(reason);
  const safeStatus = statusParsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: idParsed.data },
        include: { items: true },
      });
      if (!order) {
        throw new OrderError("订单不存在");
      }
      const from = order.status as OrderStatus;
      if (!isValidTransition(from, safeStatus)) {
        throw new OrderError(`不允许从 ${from} 变更为 ${safeStatus}`);
      }

      // 原子条件更新：状态未变化才更新成功，防并发重复流转
      const updated = await tx.order.updateMany({
        where: { id: idParsed.data, status: from },
        data: {
          status: safeStatus,
          ...(safeStatus === "CANCELLED" && {
            cancelledAt: new Date(),
            cancelledReason: reasonParsed.success
              ? (reasonParsed.data ?? null)
              : null,
          }),
          ...(safeStatus !== "CANCELLED" && {
            [timestampField(safeStatus)!]: new Date(),
          }),
        },
      });
      if (updated.count !== 1) {
        throw new OrderError("订单状态已变化，请刷新后重试");
      }

      // 取消/退款：回补库存
      if (safeStatus === "CANCELLED") {
        for (const it of order.items) {
          if (it.productId) {
            await tx.product.updateMany({
              where: { id: it.productId },
              data: { stock: { increment: it.quantity } },
            });
          }
        }
      }
    });
  } catch (e) {
    if (e instanceof OrderError) {
      return { success: false, error: e.message };
    }
    throw e;
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath("/", "layout");
  return { success: true };
}
