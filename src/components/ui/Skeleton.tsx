import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("md-shimmer rounded-[var(--md-radius-sm)]", className)} />;
}
