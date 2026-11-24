import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { signSession, verifySession } from "../jwt";

// 测试用固定密钥（signSession 在调用时读取环境变量，测试自给自足不依赖 .env）
process.env.JWT_SECRET = "test-secret-for-unit-tests";

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET);

const payload = {
  id: 1,
  email: "user@example.com",
  name: "测试用户",
  role: "USER" as const,
};

describe("signSession / verifySession（会话 JWT 签发与验证）", () => {
  it("签发后可验证并还原完整 payload", async () => {
    const token = await signSession(payload);
    const session = await verifySession(token);
    assert.deepEqual(session, payload);
  });

  it("被篡改的 token 验证失败返回 null", async () => {
    const token = await signSession(payload);
    // 修改 token 最后一个字符（保持格式合法）
    const tampered = token.slice(0, -1) + (token.endsWith("a") ? "b" : "a");
    const session = await verifySession(tampered);
    assert.equal(session, null);
  });

  it("用不同密钥签发的 token 验证失败返回 null", async () => {
    const token = await signSession(payload);
    // 换成另一把密钥再验证
    process.env.JWT_SECRET = "another-secret";
    const session = await verifySession(token);
    assert.equal(session, null);
    // 还原密钥，避免影响后续用例
    process.env.JWT_SECRET = "test-secret-for-unit-tests";
  });

  it("过期 token 验证失败返回 null", async () => {
    // 手工构造 exp 在 60 秒前（绝对时间戳）的过期 token
    const expired = await new SignJWT({
      email: payload.email,
      name: payload.name,
      role: payload.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(String(payload.id))
      .setIssuedAt(Date.now() / 1000 - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(secret());
    const session = await verifySession(expired);
    assert.equal(session, null);
  });

  it("非法字符串返回 null 而不是抛错", async () => {
    const session = await verifySession("not-a-jwt");
    assert.equal(session, null);
  });

  it("缺少 sub 声明的 token 返回 null", async () => {
    const noSub = await new SignJWT({ email: "a@b.com", name: "x", role: "USER" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(secret());
    const session = await verifySession(noSub);
    assert.equal(session, null);
  });
});
