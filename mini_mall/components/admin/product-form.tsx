"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProduct, updateProduct } from "@/lib/actions/admin-product";

type ProductFormProps = {
  /** 分类下拉选项 */
  categories: { id: number; name: string }[];
  /** 编辑模式：传入商品与 action；新建模式为 null */
  product?: {
    id: number;
    name: string;
    description: string;
    price: number; // 分
    stock: number;
    imageUrl: string;
    categoryId: number;
    isActive: boolean;
  };
};

/** 商品表单（新建/编辑共用）：useActionState 提交 Server Action */
export function ProductForm({ categories, product }: ProductFormProps) {
  const action = product ? updateProduct.bind(null, product.id) : createProduct;
  const [state, formAction, pending] = useActionState(action, {});
  // 受控输入：避免 React 19 表单 action 自动重置导致校验失败后输入清空
  const [values, setValues] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product ? (product.price / 100).toFixed(2) : "",
    stock: product ? String(product.stock) : "0",
    imageUrl: product?.imageUrl ?? "",
    categoryId: product ? String(product.categoryId) : String(categories[0]?.id ?? ""),
    isActive: product ? product.isActive : true,
  });
  const handleChange =
    (field: keyof typeof values) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">商品名称</Label>
        <Input
          id="name"
          name="name"
          placeholder="最多 100 字"
          value={values.name}
          onChange={handleChange("name")}
        />
        {state.fieldErrors?.name && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="description">商品描述</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          value={values.description}
          onChange={handleChange("description")}
        />
        {state.fieldErrors?.description && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.description[0]}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">价格（元）</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            placeholder="如 19.90"
            value={values.price}
            onChange={handleChange("price")}
          />
          {state.fieldErrors?.price && (
            <p className="text-sm text-destructive">{state.fieldErrors.price[0]}</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="stock">库存</Label>
          <Input
            id="stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            value={values.stock}
            onChange={handleChange("stock")}
          />
          {state.fieldErrors?.stock && (
            <p className="text-sm text-destructive">{state.fieldErrors.stock[0]}</p>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="imageUrl">图片地址</Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          placeholder="https://..."
          value={values.imageUrl}
          onChange={handleChange("imageUrl")}
        />
        {state.fieldErrors?.imageUrl && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.imageUrl[0]}
          </p>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="categoryId">分类</Label>
          <select
            id="categoryId"
            name="categoryId"
            value={values.categoryId}
            onChange={handleChange("categoryId")}
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {state.fieldErrors?.categoryId && (
            <p className="text-sm text-destructive">
              {state.fieldErrors.categoryId[0]}
            </p>
          )}
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input type="hidden" name="isActive" value={values.isActive ? "on" : "off"} />
          <input
            id="isActiveCheckbox"
            type="checkbox"
            className="size-4"
            checked={values.isActive}
            onChange={(e) =>
              setValues((v) => ({ ...v, isActive: e.currentTarget.checked }))
            }
          />
          <Label htmlFor="isActiveCheckbox">上架销售</Label>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "保存中..." : product ? "保存修改" : "创建商品"}
        </Button>
        <Button variant="outline" type="button" asChild>
          <a href="/admin/products">返回列表</a>
        </Button>
      </div>
    </form>
  );
}
