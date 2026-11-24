export { cn } from "cn";

/** 分 → 元字符串（含货币符号），如 12345 → "¥123.45" */
export function formatPrice(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

/** 元 → 分（四舍五入到整数分） */
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}
