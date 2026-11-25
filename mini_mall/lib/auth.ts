import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession, type SessionPayload } from "./jwt";

/** 登录回跳允许的站内路径前缀（防开放重定向） */
const ALLOWED_NEXT_PREFIXES = [
  "/products",
  "/cart",
  "/checkout",
  "/orders",
  "/admin",
] as const;

/**
 * 归一化登录回跳参数：仅允许站内已知路径，其余回退首页。
 * 防御：协议相对地址（//evil.com）、反斜杠规范化攻击（/\evil.com）、
 * 控制字符与外部域名。
 */
export function sanitizeNextPath(next: unknown): string {
  if (typeof next !== "string" || next.length === 0 || next.length > 2000) {
    return "/";
  }
  // 拒绝反斜杠与空白/控制字符（浏览器会做 \ → / 规范化）
  if (/[\\\x00-\x20\x7f]/.test(next)) {
    return "/";
  }
  if (!next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  const allowed = ALLOWED_NEXT_PREFIXES.some(
    (prefix) =>
      next === prefix ||
      next.startsWith(`${prefix}/`) ||
      next.startsWith(`${prefix}?`)
  );
  return allowed ? next : "/";
}

/** 读取当前会话；未登录或 token 无效返回 null */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  return verifySession(token);
}

/** 要求已登录，否则重定向到登录页 */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

/** 要求管理员角色，否则重定向到首页 */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== "ADMIN") {
    redirect("/");
  }
  return session;
}
