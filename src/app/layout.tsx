import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mood Mirror - 情绪镜像 | AI 情绪分析日记",
  description: "用 AI 倾听你的情绪，从慈母、严师、老友三个视角获得温暖反馈",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-50 dark:bg-zinc-900 text-gray-800 dark:text-gray-200`}
      >
        {children}
      </body>
    </html>
  );
}
