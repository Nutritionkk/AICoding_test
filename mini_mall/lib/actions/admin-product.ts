"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validations";
import { yuanToCents } from "@/lib/utils";

/** 商品表单状态（useActionState 用） */
export type AdminFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
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

/** 商品表单解析结果（可辨识联合：成功带 values，失败带 fieldErrors） */
type ProductFormValues = {
  name: string;
  description: string;
  price: number; // 分
  stock: number;
  imageUrl: string;
  categoryId: number;
  isActive: boolean;
};

type ProductFormResult =
  | { ok: true; values: ProductFormValues }
  | { ok: false; fieldErrors: Record<string, string[]> };

/** 从表单提取并解析商品数据（价格元 → 分） */
function parseProductForm(formData: FormData): ProductFormResult {
  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    price: formData.get("price"),
    stock: formData.get("stock"),
    imageUrl: formData.get("imageUrl"),
    categoryId: formData.get("categoryId"),
    isActive: formData.get("isActive"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors),
    };
  }
  const data = parsed.data;
  return {
    ok: true,
    values: {
      name: data.name,
      description: data.description,
      price: yuanToCents(Number(data.price)),
      stock: data.stock,
      imageUrl: data.imageUrl,
      categoryId: data.categoryId,
      isActive: data.isActive,
    },
  };
}

/** 创建商品 */
export async function createProduct(
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const result = parseProductForm(formData);
  if (!result.ok) {
    return { fieldErrors: result.fieldErrors };
  }
  const values = result.values;

  const category = await prisma.category.findUnique({
    where: { id: values.categoryId },
  });
  if (!category) {
    return { fieldErrors: { categoryId: ["所选分类不存在"] } };
  }

  await prisma.product.create({ data: values });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

/** 更新商品 */
export async function updateProduct(
  productId: number,
  _prevState: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  await requireAdmin();
  const result = parseProductForm(formData);
  if (!result.ok) {
    return { fieldErrors: result.fieldErrors };
  }
  const values = result.values;

  const category = await prisma.category.findUnique({
    where: { id: values.categoryId },
  });
  if (!category) {
    return { fieldErrors: { categoryId: ["所选分类不存在"] } };
  }

  await prisma.product.update({
    where: { id: productId },
    data: values,
  });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/");
  redirect("/admin/products");
}

/** 删除商品（购物车级联删除，历史订单明细保留快照） */
export async function deleteProduct(productId: number) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}
