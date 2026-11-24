import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/jwt";

// Next.js 16 路由守卫（middleware.ts 已弃用，改名 proxy.ts）
// 只做 JWT 校验，不做 DB 查询；角色级拦截的兜底在 admin layout 的 requireAdmin()

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const loginUrl = new URL(
    `/login?next=${encodeURIComponent(pathname)}`,
    request.url
  );

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.redirect(loginUrl);
  }
  if (pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/cart/:path*", "/checkout", "/orders/:path*", "/admin/:path*"],
};
