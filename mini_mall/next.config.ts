import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Prisma Client 使用原生 Node require，不打进 Server Components 的 bundle
  // （Next.js 已内置 @prisma/client 免打包清单，这里显式声明以表明意图）
  serverExternalPackages: ["@prisma/client"],
  images: {
    // 商品图片外链域名白名单（next/image 远程图片优化）
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
};

export default nextConfig;
