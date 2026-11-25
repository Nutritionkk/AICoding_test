"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** 全局错误边界（客户端组件） */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-2xl font-semibold">出错了</h1>
      <p className="text-muted-foreground">页面加载失败，请稍后重试</p>
      <Button onClick={reset}>重试</Button>
    </main>
  );
}
