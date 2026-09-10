import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans-loaded", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono-loaded", display: "swap" });

export const metadata: Metadata = {
  title: "Multi Downloader",
  description:
    "A premium, professional media downloader for YouTube, TikTok, Instagram, X, Facebook, Reddit, Twitch, Vimeo, SoundCloud & Pinterest.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${inter.variable} ${jetBrainsMono.variable} antialiased`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
