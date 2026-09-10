"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex rounded-[var(--md-radius-md)] border border-md-border bg-md-surface-2 p-1", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-0 flex items-center gap-1.5 rounded-[var(--md-radius-sm)] px-3 py-1.5 text-[13px] font-medium transition-colors",
              active ? "text-md-text-inverted" : "text-md-text-secondary hover:text-md-text-primary",
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${options.map((o) => o.value).join("-")}`}
                className="absolute inset-0 -z-10 rounded-[var(--md-radius-sm)] bg-md-accent"
                transition={{ type: "spring", stiffness: 500, damping: 34 }}
              />
            )}
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
