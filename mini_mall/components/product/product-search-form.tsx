import type { Category } from "@prisma/client";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// 原生 select 样式（与 shadcn Input 视觉一致）
const selectClass =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/**
 * 商品搜索/筛选表单：纯 HTML GET 提交（无客户端 JS）。
 * 用原生 select 而非 shadcn Select——后者是客户端组件且需要 JS 提交。
 */
export function ProductSearchForm({
  categories,
  defaultValue,
}: {
  categories: Category[];
  defaultValue: { q: string; category: string; sort: string };
}) {
  return (
    <form method="get" action="/products" className="flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="q"
          defaultValue={defaultValue.q}
          placeholder="搜索商品..."
          className="w-52 pl-8"
        />
      </div>
      <select name="category" defaultValue={defaultValue.category} className={selectClass}>
        <option value="">全部分类</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <select name="sort" defaultValue={defaultValue.sort} className={selectClass}>
        <option value="newest">最新上架</option>
        <option value="price_asc">价格从低到高</option>
        <option value="price_desc">价格从高到低</option>
      </select>
      <Button type="submit" size="sm">
        搜索
      </Button>
    </form>
  );
}
