import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--md-radius-lg)] border border-md-border bg-md-surface shadow-[var(--md-shadow-sm)]",
        className,
      )}
      {...rest}
    />
  );
}
