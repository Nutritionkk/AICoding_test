import { z } from "zod";
import { isAllowedImageUrl } from "./image-whitelist";

// ============ 类型定义 ============
// Prisma 5 的 SQLite 连接器不支持 enum，角色/状态以字符串存储，
// 应用层用联合类型保证类型安全（见 prisma/schema.prisma 顶部注释）

export type Role = "USER" | "ADMIN";

export type OrderStatus =
  | "PENDING"
  | "PAID"
  | "SHIPPED"
  | "COMPLETED"
  | "CANCELLED";

// ============ 表单校验 schema（zod 4） ============

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, "请输入用户名").max(30, "用户名最长 30 个字符"),
    email: z.email("邮箱格式不正确"),
    password: z
      .string()
      .min(8, "密码至少 8 位")
      .max(64, "密码最长 64 位"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码"),
});

export const checkoutSchema = z.object({
  receiverName: z
    .string()
    .trim()
    .min(1, "请输入收货人姓名")
    .max(30, "收货人姓名最长 30 个字符"),
  receiverPhone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, "手机号格式不正确"),
  receiverAddress: z
    .string()
    .trim()
    .min(5, "收货地址至少 5 个字符")
    .max(200, "收货地址最长 200 个字符"),
  note: z.string().trim().max(200, "备注最长 200 个字符").optional(),
});

// 商品表单（后台）：价格用「元」字符串，action 内 yuanToCents 转分；
// isActive 用 "on"/"off" 字符串（表单隐藏域保证恒存在），转为布尔值
export const productSchema = z.object({
  name: z.string().trim().min(1, "请输入商品名称").max(100, "商品名称最长 100 个字符"),
  description: z
    .string()
    .trim()
    .min(1, "请输入商品描述")
    .max(2000, "商品描述最长 2000 个字符"),
  price: z.string().refine(
    (v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0,
    "价格格式不正确"
  ),
  stock: z.coerce.number().int("库存必须是整数").min(0, "库存不能为负数"),
  imageUrl: z
    .url("图片地址必须是合法 URL")
    .refine(isAllowedImageUrl, "仅支持白名单图片域名（picsum.photos / placehold.co）"),
  categoryId: z.coerce.number().int("分类必须是整数").positive("请选择分类"),
  isActive: z
    .enum(["on", "off"])
    .transform((v) => v === "on"),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "请输入分类名称").max(30, "分类名称最长 30 个字符"),
});

// ============ 参数型 action 的运行时校验（TS 类型不能替代运行时校验） ============

/** 数据库记录 id：正整数且在 32 位 Int 范围内 */
export const idSchema = z.coerce
  .number()
  .int("ID 必须是整数")
  .positive("ID 必须为正数")
  .max(2_147_483_647, "ID 超出范围");

/** 商品数量：整数且 ≥ 1，设合理上限 */
export const quantitySchema = z.coerce
  .number()
  .int("数量必须是整数")
  .min(1, "数量至少为 1")
  .max(100_000, "数量超出上限");

/** 订单状态枚举（运行时白名单） */
export const orderStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
]);

/** 取消/退款原因 */
export const reasonSchema = z.string().trim().max(200, "原因最长 200 字").optional();

// ============ 订单状态机 ============

/** 各状态允许流转到的目标状态白名单（终态为空数组） */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"], // 待支付：可支付、可取消
  PAID: ["SHIPPED", "CANCELLED"], // 已支付：可发货、可退款（模拟退款）
  SHIPPED: ["COMPLETED"], // 已发货：可确认完成
  COMPLETED: [], // 终态
  CANCELLED: [], // 终态
};

/** 判断状态流转是否合法 */
export function isValidTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}
