/** 订单业务错误（下单/支付/取消流程中抛出，action 捕获转成用户提示） */
export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

/** 生成订单号：MM-YYYYMMDD-XXXXXX（6 位随机后缀） */
export function generateOrderNo(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  return `MM-${y}${m}${d}-${rand}`;
}
