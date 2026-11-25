"use client";

import { useState, useTransition } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { updateOrderStatus } from "@/lib/actions/admin-order";
import type { OrderStatus } from "@/lib/validations";

/** 管理侧订单状态操作按钮（发货/完成/取消退款） */
export function AdminOrderActions({
  orderId,
  status,
}: {
  orderId: number;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");

  const run = async (toStatus: OrderStatus, withReason = false) => {
    startTransition(async () => {
      const result = await updateOrderStatus(
        orderId,
        toStatus,
        withReason ? reason : undefined
      );
      if (result.success) {
        toast.success("操作成功");
        setReason("");
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  const buttons: { label: string; to: OrderStatus; variant?: "default" | "outline" | "destructive"; withReason?: boolean }[] =
    status === "PENDING"
      ? [{ label: "取消订单", to: "CANCELLED", variant: "destructive", withReason: true }]
      : status === "PAID"
        ? [
            { label: "发货", to: "SHIPPED" },
            { label: "退款", to: "CANCELLED", variant: "destructive", withReason: true },
          ]
        : status === "SHIPPED"
          ? [{ label: "确认完成", to: "COMPLETED" }]
          : [];

  if (buttons.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((b) => (
        <AlertDialog key={b.to + b.label}>
          <AlertDialogTrigger asChild>
            <Button variant={b.variant ?? "default"} disabled={pending}>
              {b.label}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {b.to === "CANCELLED" ? "确认取消订单？" : `确认${b.label}？`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {b.to === "SHIPPED" && "订单将变为已发货。"}
                {b.to === "COMPLETED" && "订单将变为已完成（终态）。"}
                {b.to === "CANCELLED" &&
                  "取消后库存将自动回补，订单状态变为已取消。"}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {b.withReason && (
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="取消原因（可选）"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel asChild>
                <Button variant="outline">再想想</Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant={b.variant ?? "default"}
                  disabled={pending}
                  onClick={() => run(b.to, b.withReason)}
                >
                  {pending ? "处理中..." : `确认${b.label}`}
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </div>
  );
}
