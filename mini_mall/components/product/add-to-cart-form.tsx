"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addToCart } from "@/lib/actions/cart";

/** 加入购物车表单（客户端组件：useActionState + sonner 提示） */
export function AddToCartForm({
  productId,
  stock,
}: {
  productId: number;
  stock: number;
}) {
  const addAction = addToCart.bind(null, productId);
  const [state, formAction, pending] = useActionState(addAction, null);

  // action 返回后弹提示（成功/失败）
  useEffect(() => {
    if (state?.success) {
      toast.success("已加入购物车");
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction} className="flex gap-2">
      <Input
        type="number"
        name="quantity"
        min={1}
        max={stock}
        defaultValue={1}
        className="w-24"
        aria-label="购买数量"
      />
      <Button type="submit" size="lg" disabled={pending || stock <= 0}>
        {pending ? "加入中..." : stock > 0 ? "加入购物车" : "暂时缺货"}
      </Button>
    </form>
  );
}
