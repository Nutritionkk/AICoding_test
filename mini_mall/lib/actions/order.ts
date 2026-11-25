"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  applyDiscount,
  getTierBySpent,
} from "@/lib/membership";
import { OrderError, generateOrderNo } from "@/lib/orders";
import {
  checkoutSchema,
  idSchema,
  quantitySchema,
  type OrderStatus,
} from "@/lib/validations";

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
 * 创建订单：事务内 读购物车→会员折扣 → 条件扣库存（防超卖）
 * → 建订单+明细快照 → 仅删除已下单项。
 * 幂等：checkoutToken + [userId, checkoutToken] 唯一约束，重复提交返回已有订单。
 * 任一步失败整体回滚。
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

  const checkoutTokenRaw = formData.get("checkoutToken");
  const checkoutToken =
    typeof checkoutTokenRaw === "string" &&
    checkoutTokenRaw.length > 0 &&
    checkoutTokenRaw.length <= 64
      ? checkoutTokenRaw
      : null;

  let orderId: number;
  try {
    orderId = await prisma.$transaction(async (tx) => {
      // 1. 事务内读购物车（避免事务外过期快照）
      const cartItems = await tx.cartItem.findMany({
        where: { userId: user.id },
        include: { product: true },
      });
      if (cartItems.length === 0) {
        throw new OrderError("购物车是空的，请先添加商品");
      }
      const inactive = cartItems.filter((it) => !it.product.isActive);
      if (inactive.length > 0) {
        throw new OrderError(`「${inactive[0].product.name}」已下架，请先从购物车移除`);
      }
      // 数量防御校验（参数型数据可能绕过加购校验写入）
      for (const it of cartItems) {
        if (!quantitySchema.safeParse(it.quantity).success) {
          throw new OrderError(`「${it.product.name}」数量无效，请调整后重试`);
        }
      }

      // 2. 会员折扣：累计实付（已支付订单）决定当前等级
      const spentSum = await tx.order.aggregate({
        where: {
          userId: user.id,
          status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
        },
        _sum: { totalAmount: true },
      });
      const tier = getTierBySpent(spentSum._sum.totalAmount ?? 0);

      // 3. 条件扣库存（原子防超卖），库存不足抛业务错误回滚
      for (const it of cartItems) {
        const updated = await tx.product.updateMany({
          where: { id: it.productId, stock: { gte: it.quantity } },
          data: { stock: { decrement: it.quantity } },
        });
        if (updated.count !== 1) {
          throw new OrderError(`「${it.product.name}」库存不足，请调整数量`);
        }
      }

      // 4. 建订单 + 明细快照（商品名/单价/图片，折前单价）
      const originalAmount = cartItems.reduce(
        (sum, it) => sum + it.product.price * it.quantity,
        0
      );
      const totalAmount = applyDiscount(originalAmount, tier.discountRate);
      const order = await tx.order.create({
        data: {
          orderNo: generateOrderNo(),
          userId: user.id,
          checkoutToken,
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

      // 5. 仅删除已下单的购物车项（不误删事务期间并发新增的项）
      await tx.cartItem.deleteMany({
        where: { id: { in: cartItems.map((it) => it.id) } },
      });

      return order.id;
    });
  } catch (e) {
    if (e instanceof OrderError) {
      return { error: e.message };
    }
    // 幂等键冲突：同一结算表单重复提交，返回已有订单
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002" &&
      checkoutToken
    ) {
      const existing = await prisma.order.findUnique({
        where: {
          userId_checkoutToken: { userId: user.id, checkoutToken },
        },
        select: { id: true },
      });
      if (existing) {
        orderId = existing.id;
      } else {
        throw e;
      }
    } else {
      throw e;
    }
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
  const idParsed = idSchema.safeParse(orderId);
  if (!idParsed.success) {
    return { success: false, error: "订单参数无效" };
  }
  const updated = await prisma.order.updateMany({
    where: { id: idParsed.data, userId: user.id, status: "PENDING" },
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

/**
 * 用户取消订单：仅 PENDING，事务内回补库存。
 * 用 updateMany 条件更新（status: PENDING）防并发双取消重复回补、
 * 防取消与支付竞态覆盖新状态。
 */
export async function cancelOrder(
  orderId: number
): Promise<OrderActionResult> {
  const user = await requireUser();
  const idParsed = idSchema.safeParse(orderId);
  if (!idParsed.success) {
    return { success: false, error: "订单参数无效" };
  }
  const id = idParsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      // 读明细（含归属校验），供回补库存使用
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order || order.userId !== user.id) {
        throw new OrderError("订单不存在");
      }

      // 条件更新：仅当仍为 PENDING 时置为 CANCELLED（并发安全）
      const updated = await tx.order.updateMany({
        where: { id, userId: user.id, status: "PENDING" },
        data: { status: "CANCELLED" as OrderStatus, cancelledAt: new Date() },
      });
      if (updated.count !== 1) {
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
