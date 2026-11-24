import { PrismaClient } from "@prisma/client";

// PrismaClient 全局单例：避免 dev 模式热重载反复创建实例导致连接泄漏
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
