import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-md-surface-3 text-md-text-secondary",
  accent: "bg-md-accent-soft text-md-accent-strong",
  success: "bg-md-success-soft text-md-success",
  warning: "bg-md-warning-soft text-md-warning",
  danger: "bg-md-danger-soft text-md-danger",
  info: "bg-md-info-soft text-md-info",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
