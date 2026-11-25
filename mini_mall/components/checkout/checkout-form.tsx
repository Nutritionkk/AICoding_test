"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/lib/actions/order";

/** 结算收货信息表单（客户端组件：useActionState 提交 Server Action） */
export function CheckoutForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(createOrder, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="receiverName">收货人</Label>
        <Input
          id="receiverName"
          name="receiverName"
          defaultValue={defaultName}
        />
        {state.fieldErrors?.receiverName && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.receiverName[0]}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="receiverPhone">手机号</Label>
        <Input
          id="receiverPhone"
          name="receiverPhone"
          placeholder="11 位手机号"
        />
        {state.fieldErrors?.receiverPhone && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.receiverPhone[0]}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="receiverAddress">收货地址</Label>
        <Textarea
          id="receiverAddress"
          name="receiverAddress"
          rows={3}
          placeholder="省市区 + 详细地址"
        />
        {state.fieldErrors?.receiverAddress && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.receiverAddress[0]}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">备注（可选）</Label>
        <Textarea id="note" name="note" rows={2} placeholder="给卖家留言" />
        {state.fieldErrors?.note && (
          <p className="text-sm text-destructive">{state.fieldErrors.note[0]}</p>
        )}
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "提交中..." : "提交订单"}
      </Button>
    </form>
  );
}
