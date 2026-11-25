"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cancelOrder, payOrder } from "@/lib/actions/order";
import type { OrderStatus } from "@/lib/validations";

/** 订单操作按钮（客户端）：待支付时可「模拟支付」与「取消订单」 */
export function OrderActionButtons({
  orderId,
  status,
}: {
  orderId: number;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();

  if (status !== "PENDING") {
    return null;
  }

  const run = async (
    action: () => Promise<{ success: boolean; error?: string }>
  ) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success("操作成功");
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  return (
    <div className="flex gap-2">
      {/* 模拟支付：确认后直接置为已支付 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button disabled={pending}>{pending ? "处理中..." : "去支付"}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认支付？</AlertDialogTitle>
            <AlertDialogDescription>
              这是模拟支付，点击确认后订单将立即变为已支付状态。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">再想想</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                disabled={pending}
                onClick={() => run(() => payOrder(orderId))}
              >
                {pending ? "处理中..." : "确认支付"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 取消订单：回补库存 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" disabled={pending}>
            取消订单
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消订单？</AlertDialogTitle>
            <AlertDialogDescription>
              取消后库存将自动回补，订单状态变为已取消。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">再想想</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => run(() => cancelOrder(orderId))}
              >
                {pending ? "处理中..." : "确认取消"}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
