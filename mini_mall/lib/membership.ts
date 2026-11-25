import { prisma } from "./db";

/** 会员等级（按累计实付金额，单位：分） */
export type MemberTier = {
  level: number; // 0-3
  name: string;
  minSpent: number; // 门槛（分）
  discountRate: number; // 折扣率，1=无折扣
};

/** 等级表：普通 / 心级1 / 心级2 / 心级3 */
export const MEMBER_TIERS: MemberTier[] = [
  { level: 0, name: "普通会员", minSpent: 0, discountRate: 1 },
  { level: 1, name: "心级1", minSpent: 800_000, discountRate: 0.98 }, // 8000 元
  { level: 2, name: "心级2", minSpent: 8_000_000, discountRate: 0.95 }, // 8 万元
  { level: 3, name: "心级3", minSpent: 80_000_000, discountRate: 0.9 }, // 80 万元
];

/** 按累计实付（分）取当前会员等级（满足门槛的最高级） */
export function getTierBySpent(spentCents: number): MemberTier {
  let tier = MEMBER_TIERS[0];
  for (const t of MEMBER_TIERS) {
    if (spentCents >= t.minSpent) {
      tier = t;
    }
  }
  return tier;
}

/** 下一等级与差距（分）；已是最高级返回 null */
export function getNextTier(
  spentCents: number
): { tier: MemberTier; remaining: number } | null {
  const current = getTierBySpent(spentCents);
  const next = MEMBER_TIERS.find((t) => t.level === current.level + 1);
  if (!next) {
    return null;
  }
  return { tier: next, remaining: next.minSpent - spentCents };
}

/** 按折扣率计算实付金额（四舍五入到分） */
export function applyDiscount(
  amountCents: number,
  discountRate: number
): number {
  return Math.round(amountCents * discountRate);
}

/** 用户累计实付（分）：所有已支付订单（PAID/SHIPPED/COMPLETED）实付之和 */
export async function getUserSpent(userId: number): Promise<number> {
  const sum = await prisma.order.aggregate({
    where: {
      userId,
      status: { in: ["PAID", "SHIPPED", "COMPLETED"] },
    },
    _sum: { totalAmount: true },
  });
  return sum._sum.totalAmount ?? 0;
}
