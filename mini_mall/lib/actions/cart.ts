"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { mergedQuantity } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { idSchema, quantitySchema } from "@/lib/validations";

/** 购物车 action 返回结果（供 sonner 提示） */
export type CartActionResult = {
  success: boolean;
  error?: string;
};

/**
 * 加入购物车（表单 action，useActionState 绑定商品 id）。
 * upsert 增量合并，数量上限为库存。
 */
export async function addToCart(
  productId: number,
  _prevState: CartActionResult | null,
  formData: FormData
): Promise<CartActionResult> {
  const user = await requireUser();
  const idParsed = idSchema.safeParse(productId);
  if (!idParsed.success) {
    return { success: false, error: "商品参数无效" };
  }

  const product = await prisma.product.findUnique({
    where: { id: idParsed.data },
  });
  if (!product || !product.isActive) {
    return { success: false, error: "商品不存在或已下架" };
  }
  if (product.stock <= 0) {
    return { success: false, error: "商品暂时缺货" };
  }

  // 运行时校验数量（表单外调用可传非法值）
  const quantityParsed = quantitySchema.safeParse(formData.get("quantity"));
  const added = quantityParsed.success ? quantityParsed.data : 1;
  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });
  const finalQuantity = mergedQuantity(
    existing?.quantity ?? 0,
    added,
    product.stock
  );

  await prisma.cartItem.upsert({
    where: { userId_productId: { userId: user.id, productId } },
    create: { userId: user.id, productId, quantity: finalQuantity },
    update: { quantity: finalQuantity },
  });

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

/** 修改购物车数量（数量 ≤ 0 转为删除），数量上限为库存 */
export async function updateCartQuantity(
  cartItemId: number,
  quantity: number
): Promise<CartActionResult> {
  const user = await requireUser();
  const idParsed = idSchema.safeParse(cartItemId);
  if (!idParsed.success) {
    return { success: false, error: "购物车项参数无效" };
  }
  const quantityParsed = z.coerce.number().int("数量必须是整数").safeParse(quantity);
  if (!quantityParsed.success) {
    return { success: false, error: "数量无效" };
  }
  const finalQuantity = Math.min(quantityParsed.data, 100_000);

  if (finalQuantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { id: idParsed.data, userId: user.id },
    });
  } else {
    const item = await prisma.cartItem.findUnique({
      where: { id: idParsed.data },
      include: { product: true },
    });
    // 归属校验：不存在或不属于当前用户则拒绝
    if (!item || item.userId !== user.id) {
      return { success: false, error: "购物车项不存在" };
    }
    // 库存为 0 时拒绝写入 0 数量（否则可产生零金额订单）
    if (item.product.stock <= 0) {
      return { success: false, error: "商品已售罄，请删除该条目" };
    }
    await prisma.cartItem.updateMany({
      where: { id: idParsed.data, userId: user.id },
      data: { quantity: Math.min(finalQuantity, item.product.stock) },
    });
  }

  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}

/** 删除购物车项（带归属校验） */
export async function removeCartItem(
  cartItemId: number
): Promise<CartActionResult> {
  const user = await requireUser();
  const idParsed = idSchema.safeParse(cartItemId);
  if (!idParsed.success) {
    return { success: false, error: "购物车项参数无效" };
  }
  await prisma.cartItem.deleteMany({
    where: { id: idParsed.data, userId: user.id },
  });
  revalidatePath("/cart");
  revalidatePath("/", "layout");
  return { success: true };
}
