import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "登录",
};

/** 登录页（服务端壳：静态渲染，searchParams 读取下沉到 Suspense 内） */
export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  return (
    <main className="flex flex-1 items-center justify-center py-16">
      <Suspense fallback={<div className="h-96 w-full max-w-sm" />}>
        <LoginFormWrapper searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/** 在 Suspense 边界内读取 searchParams（运行时 API），避免阻塞静态壳 */
async function LoginFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;
  // 重复 query 参数归一化（?next=a&next=b 时是数组）
  const nextValue = Array.isArray(next) ? next[0] : next;
  return <LoginForm next={nextValue} />;
}
