"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 480,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            style={{ width }}
            className="md-glass max-h-[80vh] overflow-hidden rounded-[var(--md-radius-lg)] border border-md-border shadow-[var(--md-shadow-lg)]"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-md-border px-5 py-4">
              <h2 className="text-sm font-semibold text-md-text-primary">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-md-text-tertiary hover:bg-md-surface-2 hover:text-md-text-primary"
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[calc(80vh-56px)] overflow-y-auto p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
