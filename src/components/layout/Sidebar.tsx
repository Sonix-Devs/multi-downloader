"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Download, History, Scale, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Downloader", icon: Download },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/legal", label: "Legal", icon: Scale },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col gap-1 border-r border-md-border bg-md-bg-elevated px-3 py-4 md:flex">
      <div className="mb-5 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-md-accent to-md-cyan text-sm font-bold text-white shadow-[var(--md-shadow-glow)]">
          M
        </div>
        <div className="leading-tight">
          <p className="text-[13px] font-bold text-md-text-primary">Multi Downloader</p>
          <p className="text-[10px] text-md-text-tertiary">v1.0.0</p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-2.5 rounded-[var(--md-radius-md)] px-3 py-2 text-[13px] font-medium transition-colors"
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-[var(--md-radius-md)] bg-md-surface-2"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className={`relative z-10 flex items-center gap-2.5 ${active ? "text-md-text-primary" : "text-md-text-secondary"}`}>
                <Icon size={16} />
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[var(--md-radius-md)] border border-md-border bg-md-surface-2 p-3">
        <p className="text-[11px] leading-relaxed text-md-text-tertiary">
          Powered by <span className="font-semibold text-md-text-secondary">yt-dlp</span> &amp;{" "}
          <span className="font-semibold text-md-text-secondary">ffmpeg</span>. Please respect each platform&apos;s
          Terms of Service and only download content you have rights to.
        </p>
      </div>
    </aside>
  );
}
