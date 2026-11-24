import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Header 读取 cookies()/DB（运行时 API），按 Next 16 PPR 约定
// 用 Suspense 包裹：静态壳用 fallback 预渲染，Header 请求时流式渲染

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: {
    default: "Mini Mall - 微型电商",
    template: "%s | Mini Mall",
  },
  description: "Next.js 16 全栈微型电商项目",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={<header className="h-14 border-b" />}>
          <Header />
        </Suspense>
        {children}
        <footer className="border-t py-6 text-center text-sm text-muted-foreground">
          Mini Mall · Next.js 16 全栈练习项目
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
