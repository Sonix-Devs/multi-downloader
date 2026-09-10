"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface ProgressBarProps {
  percent: number;
  tone?: "accent" | "success" | "danger" | "warning";
  indeterminate?: boolean;
  className?: string;
  trackClassName?: string;
}

const TONE_GRADIENT: Record<string, string> = {
  accent: "linear-gradient(90deg, var(--md-accent), var(--md-cyan))",
  success: "linear-gradient(90deg, #35d68a, #35e6c3)",
  danger: "linear-gradient(90deg, #ff5c72, #ff8c5c)",
  warning: "linear-gradient(90deg, #ffb545, #ff8c5c)",
};

export function ProgressBar({ percent, tone = "accent", indeterminate, className, trackClassName }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-md-surface-3", trackClassName, className)}
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {indeterminate ? (
        <motion.div
          className="absolute inset-y-0 w-1/3 rounded-full"
          style={{ background: TONE_GRADIENT[tone] }}
          animate={{ x: ["-40%", "220%"] }}
          transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
        />
      ) : (
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: TONE_GRADIENT[tone] }}
          initial={false}
          animate={{ width: `${clamped}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22, mass: 0.6 }}
        />
      )}
    </div>
  );
}
