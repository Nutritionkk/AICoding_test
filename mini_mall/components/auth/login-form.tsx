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
import { login } from "@/lib/actions/auth";

/** 登录表单（客户端组件：useActionState 提交 Server Action） */
export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(login, {});
  // 受控输入：React 19 表单 action 提交后会自动重置非受控字段，
  // 导致校验失败时用户输入被清空，故全部改为受控
  const [values, setValues] = useState({ email: "", password: "" });
  const handleChange =
    (field: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>登录</CardTitle>
        <CardDescription>欢迎回到 Mini Mall</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={next ?? ""} />
          {state.error && <Alert variant="destructive">{state.error}</Alert>}
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
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange("password")}
            />
            {state.fieldErrors?.password && (
              <p className="text-sm text-destructive">{state.fieldErrors.password[0]}</p>
            )}
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "登录中..." : "登录"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            还没有账号？
            <a href="/register" className="ml-1 text-foreground underline">
              去注册
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
