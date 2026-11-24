import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** 全局导航栏（Server Component：直接读会话与购物车数量） */
export async function Header() {
  const session = await getSession();

  // 购物车角标数量（未登录为 0）
  let cartCount = 0;
  if (session) {
    const sum = await prisma.cartItem.aggregate({
      where: { userId: session.id },
      _sum: { quantity: true },
    });
    cartCount = sum._sum.quantity ?? 0;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            Mini Mall
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/products" className="transition-colors hover:text-foreground">
              全部商品
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="relative" aria-label="购物车">
            <Button variant="ghost" size="icon-sm" asChild>
              <span>
                <ShoppingCart />
              </span>
            </Button>
            {cartCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px]">
                {cartCount}
              </Badge>
            )}
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              <Link
                href="/orders"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                我的订单
              </Link>
              {session.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  后台管理
                </Link>
              )}
              <span className="text-sm">{session.name}</span>
              <form action={logout}>
                <Button variant="outline" size="sm" type="submit">
                  退出
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">登录</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">注册</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
