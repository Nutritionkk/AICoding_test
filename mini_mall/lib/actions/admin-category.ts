"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validations";

/** 分类操作结果 */
export type CategoryActionResult = {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** 创建分类（重名时返回友好错误） */
export async function createCategory(
  _prevState: CategoryActionResult,
  formData: FormData
): Promise<CategoryActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { success: false, fieldErrors: { name: fe.name ?? [] } };
  }
  try {
    await prisma.category.create({ data: { name: parsed.data.name } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { success: false, fieldErrors: { name: ["分类已存在"] } };
    }
    throw e;
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

/** 重命名分类 */
export async function updateCategory(
  categoryId: number,
  _prevState: CategoryActionResult,
  formData: FormData
): Promise<CategoryActionResult> {
  await requireAdmin();
  const parsed = categorySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { success: false, fieldErrors: { name: fe.name ?? [] } };
  }
  try {
    await prisma.category.update({
      where: { id: categoryId },
      data: { name: parsed.data.name },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { success: false, fieldErrors: { name: ["分类已存在"] } };
    }
    throw e;
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

/** 删除分类（分类下仍有商品时被外键 Restrict 拦截） */
export async function deleteCategory(
  categoryId: number
): Promise<CategoryActionResult> {
  await requireAdmin();
  try {
    await prisma.category.delete({ where: { id: categoryId } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2003") {
      return { success: false, error: "该分类下仍有商品，无法删除" };
    }
    throw e;
  }
  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}
