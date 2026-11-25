import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: { default: "后台管理", template: "%s | Mini Mall 后台" },
};

// 需先校验管理员会话再渲染（proxy 已拦截非管理员，这里是第二层防护）
export const instant = false;

/** 后台布局：管理员校验 + 左侧导航 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  const navItems = [
    { href: "/admin", label: "仪表盘" },
    { href: "/admin/products", label: "商品管理" },
    { href: "/admin/categories", label: "分类管理" },
    { href: "/admin/orders", label: "订单管理" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-8">
      <aside className="w-40 shrink-0">
        <nav className="sticky top-20 flex flex-col gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
