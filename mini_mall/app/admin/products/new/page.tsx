import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "新增商品",
};

/** 新增商品页 */
export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { id: "asc" } });
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">新增商品</h1>
      <div className="max-w-xl">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
