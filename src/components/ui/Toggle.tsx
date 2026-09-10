"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}) {
  const control = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-40",
        checked ? "border-md-accent bg-md-accent" : "border-md-border-strong bg-md-surface-3",
      )}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 32 }}
        className="absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow-md"
        style={{ left: checked ? "calc(100% - 20px)" : "3px", height: 18, width: 18 }}
      />
    </button>
  );

  if (!label) return control;

  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span className="flex flex-col">
        <span className="text-sm font-medium text-md-text-primary">{label}</span>
        {description && <span className="text-xs text-md-text-tertiary">{description}</span>}
      </span>
      {control}
    </label>
  );
}
