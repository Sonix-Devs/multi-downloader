"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Inbox } from "lucide-react";
import type { DownloadItem } from "@/types/download";
import { DownloadCard } from "./DownloadCard";

export function DownloadQueue({
  items,
  emptyTitle = "Nothing queued",
  emptyDescription = "Paste a link above to start your first download.",
}: {
  items: DownloadItem[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center gap-2 rounded-[var(--md-radius-lg)] border border-dashed border-md-border py-14 text-center"
      >
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-md-surface-2 text-md-text-tertiary">
          <Inbox size={20} />
        </div>
        <p className="text-sm font-medium text-md-text-secondary">{emptyTitle}</p>
        <p className="text-xs text-md-text-tertiary">{emptyDescription}</p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <DownloadCard key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}
