"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import { CircleAlert, Clock, Eye, RefreshCw } from "lucide-react";
import type { ContentMetadata } from "@/types/download";
import { formatCompactNumber, formatDuration } from "@/lib/format";
import { PlatformBadge } from "./PlatformBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

export function PreviewCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-[var(--md-radius-lg)] border border-md-border bg-md-surface p-4 sm:flex-row"
    >
      <Skeleton className="h-40 w-full shrink-0 sm:h-24 sm:w-40" />
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </motion.div>
  );
}

export function PreviewCardError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-start gap-3 rounded-[var(--md-radius-lg)] border border-md-danger/30 bg-md-danger-soft p-4 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-md-danger/15 text-md-danger">
        <CircleAlert size={20} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-md-text-primary">Couldn&apos;t load this link</p>
        <p className="mt-0.5 text-[13px] text-md-text-secondary">{message}</p>
      </div>
      <Button variant="outline" size="sm" leftIcon={<RefreshCw size={13} />} onClick={onRetry} className="w-full sm:w-auto">
        Retry
      </Button>
    </motion.div>
  );
}

export function PreviewCard({ metadata }: { metadata: ContentMetadata }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="flex flex-col gap-4 rounded-[var(--md-radius-lg)] border border-md-border bg-md-surface p-4 sm:flex-row"
    >
      <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-[var(--md-radius-md)] bg-md-surface-3 sm:h-24 sm:w-40">
        {metadata.thumbnailUrl ? (
          <img src={metadata.thumbnailUrl} alt={metadata.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-md-text-tertiary">
            <PlatformBadge platform={metadata.platform} size="lg" />
          </div>
        )}
        {metadata.durationSeconds !== null && (
          <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[11px] text-white">
            {formatDuration(metadata.durationSeconds)}
          </span>
        )}
        {metadata.isLive && (
          <span className="absolute left-1 top-1 flex items-center gap-1 rounded bg-md-danger px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className="flex items-center gap-2">
          <PlatformBadge platform={metadata.platform} size="sm" />
          <h3 className="truncate text-[15px] font-semibold text-md-text-primary">{metadata.title}</h3>
        </div>
        {metadata.creator && <p className="truncate text-[13px] text-md-text-secondary">{metadata.creator}</p>}
        <div className="mt-1 flex items-center gap-3.5 text-xs text-md-text-tertiary">
          {metadata.durationSeconds !== null && (
            <span className="flex items-center gap-1">
              <Clock size={12} /> {formatDuration(metadata.durationSeconds)}
            </span>
          )}
          {metadata.viewCount !== null && (
            <span className="flex items-center gap-1">
              <Eye size={12} /> {formatCompactNumber(metadata.viewCount)} views
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
