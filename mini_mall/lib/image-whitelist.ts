// 商品图片域名白名单：与 next.config.ts 的 images.remotePatterns 保持一致，
// 修改此处时需同步修改 next.config.ts（next/image 服务端拉取仅限这些域名，防 SSRF）

export const IMAGE_HOSTS = ["picsum.photos", "placehold.co"] as const;

/** 校验图片地址是否属于白名单域名（http/https） */
export function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.protocol === "https:" || parsed.protocol === "http:") &&
      IMAGE_HOSTS.includes(parsed.hostname as (typeof IMAGE_HOSTS)[number])
    );
  } catch {
    return false;
  }
}
