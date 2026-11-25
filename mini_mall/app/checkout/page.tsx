import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  applyDiscount,
  getNextTier,
  getTierBySpent,
  getUserSpent,
} from "@/lib/membership";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "结算",
};

// 需先读会话再渲染
export const instant = false;

/** 结算页：会员卡（等级/折扣/升级进度）+ 订单摘要 + 收货表单 */
export default async function CheckoutPage() {
  const user = await requireUser();
  const cartItems = await prisma.cartItem.findMany({
    where: { userId: user.id },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center gap-4 px-4 py-24">
        <p className="text-muted-foreground">购物车是空的，无法结算</p>
        <Button asChild>
          <Link href="/products">去逛逛</Link>
        </Button>
      </main>
    );
  }

  const originalAmount = cartItems.reduce(
    (sum, it) => sum + it.product.price * it.quantity,
    0
  );
  const spent = await getUserSpent(user.id);
  const tier = getTierBySpent(spent);
  const payable = applyDiscount(originalAmount, tier.discountRate);
  const discountAmount = originalAmount - payable;
  const next = getNextTier(spent);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">确认订单</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-6">
          {/* 订单摘要 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">商品清单</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {cartItems.map((it) => (
                <div key={it.id} className="flex items-center gap-3">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                    <Image
                      src={it.product.imageUrl}
                      alt={it.product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium">
                      {it.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPrice(it.product.price)} × {it.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {formatPrice(it.product.price * it.quantity)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 收货信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">收货信息</CardTitle>
            </CardHeader>
            <CardContent>
              <CheckoutForm defaultName={user.name} />
            </CardContent>
          </Card>
        </div>

        {/* 会员卡 + 金额 */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">会员权益</CardTitle>
              <Badge variant="secondary">{tier.name}</Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              {tier.discountRate < 1 ? (
                <p>
                  本单享受 <span className="font-semibold text-primary">{(tier.discountRate * 10).toFixed(1)} 折</span>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  当前无折扣，累计实付满 8000 元升级心级1（9.8 折）
                </p>
              )}
              {next && (
                <p className="text-xs text-muted-foreground">
                  距 {next.tier.name}（{(next.tier.discountRate * 10).toFixed(1)} 折）还差{" "}
                  {formatPrice(next.remaining)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-2 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">商品合计</span>
                <span>{formatPrice(originalAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-primary">
                  <span>会员优惠</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span>应付金额</span>
                <span className="text-2xl font-semibold text-primary">
                  {formatPrice(payable)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
