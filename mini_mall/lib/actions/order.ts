"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  applyDiscount,
  getTierBySpent,
} from "@/lib/membership";
import { OrderError, generateOrderNo } from "@/lib/orders";
import { checkoutSchema, type OrderStatus } from "@/lib/validations";

/** 结算表单状态（useActionState 用） */
export type CheckoutFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** 订单操作结果（支付/取消按钮用） */
export type OrderActionResult = {
  success: boolean;
  error?: string;
};

function toFieldErrors(errors: Record<string, string[] | undefined>) {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * 创建订单：事务内 读累计实付→会员折扣 → 条件扣库存（防超卖）
 * → 建订单+明细快照 → 清空购物车。任一步失败整体回滚。
 */
export async function createOrder(
  _prevState: CheckoutFormState,
  formData: FormData
): Promise<CheckoutFormState> {
  const user = await requireUser();

  const parsed = checkoutSchema.safeParse({
    receiverName: formData.get("receiverName"),
    receiverPhone: formData.get("receiverPhone"),
    receiverAddress: formData.get("receiverAddress"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
  });
  if (cartItems.length === 0) {
    return { error: "购物车是空的，请先添加商品" };
  }
  const inactive = cartItems.filter((it) => !it.product.isActive);
  if (inactive.length > 0) {
    return { error: `「${inactive[0].product.name}」已下架，请先从购物车移除` };
  }

  let orderId: number;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      // 1. 会员折扣：累计实付（已支付订单）决定当前等级
      const spentSum = await tx.order.aggregate({
        where: {
          userId: user.id,
          status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
        },
        _sum: { totalAmount: true },
      });
      const tier = getTierBySpent(spentSum._sum.totalAmount ?? 0);

      // 2. 条件扣库存（原子防超卖），库存不足抛业务错误回滚
      for (const it of cartItems) {
        const updated = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.quantity } },
          data: { stock: { decrement: it.quantity } },
        });
        if (updated.count !== 1) {
          throw new OrderError(`「${it.product.name}」库存不足，请调整数量`);
        }
      }

      // 3. 建订单 + 明细快照（商品名/单价/图片，折前单价）
      const originalAmount = cartItems.reduce(
        (sum, it) => sum + it.product.price * it.quantity,
        0
      );
      const totalAmount = applyDiscount(originalAmount, tier.discountRate);
      const order = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId: user.id,
          status: "PENDING",
          originalAmount,
          discountRate: tier.discountRate,
          totalAmount,
          receiverName: parsed.data.receiverName,
          receiverPhone: parsed.data.receiverPhone,
          receiverAddress: parsed.data.receiverAddress,
          note: parsed.data.note,
          items: {
            create: cartItems.map((it) => ({
              productId: it.product.id,
              productName: it.product.name,
              price: it.product.price,
              quantity: it.quantity,
              imageUrl: it.product.imageUrl,
            })),
          },
        },
      });

      // 4. 清空购物车
      await tx.cartItem.deleteMany({ where: { userId: user.id } });

      return order.id;
    });
  } catch (e) {
    if (e instanceof OrderError) {
      return { error: e.message };
    }
    throw e;
  }

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}`);
}

/** 模拟支付：PENDING → PAID（记录支付时间） */
export async function payOrder(
  orderId: number
): Promise<OrderActionResult> {
  const user = await requireUser();
  const updated = await prisma.order.updateMany({
    where: { id: orderId, userId: user.id, status: "PENDING" },
    data: { status: "PAID", paidAt: new Date() },
  });
  if (updated.count !== 1) {
    return { success: false, error: "订单状态已变化，无法支付" };
  }
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/", "layout");
  return { success: true };
}

/** 用户取消订单：仅 PENDING，事务内回补库存 */
export async function cancelOrder(
  orderId: number
): Promise<OrderActionResult> {
  const user = await requireUser();
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order || order.userId !== user.id) {
        throw new OrderError("订单不存在");
      }
      if (order.status !== "PENDING") {
        throw new OrderError("仅待支付订单可以取消");
      }
      // 回补库存（商品仍存在时）
      for (const it of order.items) {
        if (it.productId) {
          await tx.product.updateMany({
            where: { id: it.productId },
            data: { stock: { increment: it.quantity } },
          });
        }
      }
      await tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" as OrderStatus, cancelledAt: new Date() },
      });
    });
  } catch (e) {
    if (e instanceof OrderError) {
      return { success: false, error: e.message };
    }
    throw e;
  }
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  revalidatePath("/", "layout");
  return { success: true };
}
