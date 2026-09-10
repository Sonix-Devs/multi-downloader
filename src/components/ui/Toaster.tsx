"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/cn";

const ICONS = {
  success: CheckCircle2,
  error: TriangleAlert,
  info: Info,
};

const TONE_CLASSES = {
  success: "text-md-success",
  error: "text-md-danger",
  info: "text-md-info",
};

export function Toaster() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[340px] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="md-glass pointer-events-auto flex items-start gap-3 rounded-[var(--md-radius-md)] border border-md-border p-3.5 shadow-[var(--md-shadow-lg)]"
            >
              <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", TONE_CLASSES[toast.variant])} size={18} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-md-text-primary">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-xs text-md-text-secondary">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-md-text-tertiary hover:text-md-text-primary"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
