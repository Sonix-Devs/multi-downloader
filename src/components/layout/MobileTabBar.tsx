"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Download, History, Scale, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Download", icon: Download },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/legal", label: "Legal", icon: Scale },
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-md-border bg-md-bg-elevated/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium"
          >
            {active && (
              <motion.span
                layoutId="mobile-tab-active"
                className="absolute inset-x-3 top-0 h-0.5 rounded-full bg-gradient-to-r from-md-accent to-md-cyan"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <Icon size={19} className={active ? "text-md-text-primary" : "text-md-text-tertiary"} />
            <span className={active ? "text-md-text-primary" : "text-md-text-tertiary"}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
