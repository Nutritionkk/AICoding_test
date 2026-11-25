"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrder } from "@/lib/actions/order";

/** 结算收货信息表单（客户端组件：useActionState 提交 Server Action） */
export function CheckoutForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(createOrder, {});
  // 下单幂等键：同一结算表单重复提交只创建一单
  const [checkoutToken] = useState(() => crypto.randomUUID());
  // 受控输入：避免 React 19 表单 action 自动重置导致校验失败后输入清空
  const [values, setValues] = useState({
    receiverName: defaultName,
    receiverPhone: "",
    receiverAddress: "",
    note: "",
  });
  const handleChange =
    (field: keyof typeof values) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="checkoutToken" value={checkoutToken} />
      {state.error && <Alert variant="destructive">{state.error}</Alert>}
      <div className="flex flex-col gap-2">
        <Label htmlFor="receiverName">收货人</Label>
        <Input
          id="receiverName"
          name="receiverName"
          value={values.receiverName}
          onChange={handleChange("receiverName")}
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
          value={values.receiverPhone}
          onChange={handleChange("receiverPhone")}
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
          value={values.receiverAddress}
          onChange={handleChange("receiverAddress")}
        />
        {state.fieldErrors?.receiverAddress && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.receiverAddress[0]}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">备注（可选）</Label>
        <Textarea
          id="note"
          name="note"
          rows={2}
          placeholder="给卖家留言"
          value={values.note}
          onChange={handleChange("note")}
        />
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
