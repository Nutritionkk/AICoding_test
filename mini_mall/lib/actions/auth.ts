"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/jwt";
import { loginSchema, registerSchema, type Role } from "@/lib/validations";

/** 认证表单 action 的返回状态（useActionState 用） */
export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** 把 zod flatten 的 fieldErrors（值可能为 undefined）过滤成干净结构 */
function toFieldErrors(errors: Record<string, string[] | undefined>) {
  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(errors)) {
    if (value) {
      result[key] = value;
    }
  }
  return result;
}

/** 写入会话 cookie（httpOnly，7 天） */
async function setSessionCookie(payload: {
  id: number;
  email: string;
  name: string;
  role: Role;
}) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** 注册：校验 → 查重 → 建用户 → 写会话 → 跳首页 */
export async function register(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "该邮箱已被注册" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  await setSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });
  revalidatePath("/", "layout");
  redirect("/");
}

/** 登录：校验 → 查用户 → 比对密码 → 写会话 → 跳转（支持 next 回跳） */
export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error.flatten().fieldErrors) };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "邮箱或密码不正确" };
  }
  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return { error: "邮箱或密码不正确" };
  }

  await setSessionCookie({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });
  revalidatePath("/", "layout");

  // 防开放重定向：仅允许站内已知路径（含反斜杠规范化攻击防御）
  redirect(sanitizeNextPath(formData.get("next")));
}

/** 登出：删 cookie → 跳登录页 */
export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}
