import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./validations";

// ============ 会话 JWT（自建认证，jose 纯 JS 可在 Node/Edge 运行） ============
// 注意：本文件不得 import prisma —— proxy.ts 会引用它

export type SessionPayload = {
  id: number;
  email: string;
  name: string;
  role: Role;
};

/** 会话有效期：7 天（秒） */
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

/** 会话 cookie 名 */
export const SESSION_COOKIE = "mm_session";

/** 读取 JWT_SECRET（每次调用时读取，便于测试替换） */
function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("缺少环境变量 JWT_SECRET");
  }
  return new TextEncoder().encode(secret);
}

/** 签发会话 JWT（HS256，7 天） */
export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

/** 验证并解析会话 JWT；任何失败（篡改/过期/密钥不符）返回 null，不抛错 */
export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string") {
      return null;
    }
    return {
      id: Number(payload.sub),
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
