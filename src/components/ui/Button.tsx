"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg" | "icon";

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "children"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
>;

interface ButtonProps extends NativeButtonProps {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-md-accent text-white shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_8px_20px_-8px_var(--md-accent-soft)] hover:bg-md-accent-strong",
  secondary: "bg-md-surface-3 text-md-text-primary hover:bg-md-border-strong",
  outline: "border border-md-border-strong text-md-text-primary hover:bg-md-surface-2",
  ghost: "text-md-text-secondary hover:text-md-text-primary hover:bg-md-surface-2",
  danger: "bg-md-danger/90 text-white hover:bg-md-danger",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-[var(--md-radius-sm)]",
  md: "h-9 px-4 text-sm gap-2 rounded-[var(--md-radius-md)]",
  lg: "h-11 px-5 text-[15px] gap-2 rounded-[var(--md-radius-md)]",
  icon: "h-9 w-9 rounded-[var(--md-radius-md)] justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", isLoading, leftIcon, rightIcon, className, children, disabled, ...rest }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: disabled ? 1 : 1.015 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex select-none items-center font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...rest}
      >
        {isLoading ? (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
