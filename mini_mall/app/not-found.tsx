import Link from "next/link";
import { Button } from "@/components/ui/button";

/** 全局 404 页面 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground">页面不存在或已被移除</p>
      <Button asChild>
        <Link href="/">回到首页</Link>
      </Button>
    </main>
  );
}
