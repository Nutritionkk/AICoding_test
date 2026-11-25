"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/lib/actions/auth";

/** 注册表单（客户端组件：useActionState 提交 Server Action） */
export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, {});
  // 受控输入：React 19 表单 action 提交后自动重置非受控字段，
  // 导致校验失败时用户输入被清空，故全部改为受控
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const handleChange =
    (field: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>注册</CardTitle>
        <CardDescription>创建你的 Mini Mall 账号</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {state.error && <Alert variant="destructive">{state.error}</Alert>}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">用户名</Label>
            <Input
              id="name"
              name="name"
              placeholder="你的昵称"
              autoComplete="username"
              value={values.name}
              onChange={handleChange("name")}
            />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={values.email}
              onChange={handleChange("email")}
            />
            {state.fieldErrors?.email && (
              <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="至少 8 位"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange("password")}
            />
            {state.fieldErrors?.password && (
              <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange("confirmPassword")}
            />
            {state.fieldErrors?.confirmPassword && (
              <p className="text-sm text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "注册中..." : "注册"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            已有账号？
            <a href="/login" className="ml-1 text-foreground underline">
              去登录
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
