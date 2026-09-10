"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
/* eslint-disable @next/next/no-img-element */
import {
  Check,
  ChevronDown,
  CircleX,
  Copy,
  FileWarning,
  FolderOpen,
  Loader2,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import type { DownloadItem } from "@/types/download";
import { PlatformBadge } from "./PlatformBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatBytes, formatEta, formatSpeed, formatRelativeDate } from "@/lib/format";
import { useDownloadsStore } from "@/store/downloadsStore";
import { useUIStore } from "@/store/uiStore";

const STATUS_LABEL: Record<DownloadItem["status"], string> = {
  queued: "Queued",
  fetching_metadata: "Reading link…",
  downloading: "Downloading",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
  canceled: "Canceled",
};

function CheckmarkDraw() {
  return (
    <motion.svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--md-success)"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />
      <motion.path
        d="M7.5 12.5L10.5 15.5L16.5 9"
        stroke="var(--md-success)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, delay: 0.35, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

export function DownloadCard({ item }: { item: DownloadItem }) {
  const cancel = useDownloadsStore((s) => s.cancel);
  const retry = useDownloadsStore((s) => s.retry);
  const remove = useDownloadsStore((s) => s.remove);
  const pushToast = useUIStore((s) => s.pushToast);
  const [logOpen, setLogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isActive = item.status === "downloading" || item.status === "processing" || item.status === "queued";
  const isTerminal = item.status === "completed" || item.status === "failed" || item.status === "canceled";

  async function copyPath() {
    if (!item.filePath) return;
    try {
      await navigator.clipboard.writeText(item.filePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      pushToast({ title: "Couldn't copy path", variant: "error" });
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="rounded-[var(--md-radius-lg)] border border-md-border bg-md-surface p-4"
    >
      <div className="flex gap-3.5">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[var(--md-radius-sm)] bg-md-surface-3">
          {item.thumbnailUrl ? (
            <img src={item.thumbnailUrl} alt={item.title ?? "thumbnail"} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <PlatformBadge platform={item.platform} size="sm" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <PlatformBadge platform={item.platform} size="sm" />
                <h4 className="truncate text-sm font-semibold text-md-text-primary">{item.title ?? item.url}</h4>
              </div>
              {item.creator && <p className="mt-0.5 truncate text-xs text-md-text-tertiary">{item.creator}</p>}
            </div>
            <StatusPill item={item} />
          </div>

          {isActive && (
            <div className="mt-3 space-y-1.5">
              <ProgressBar
                percent={item.progressPercent}
                tone={item.status === "processing" ? "warning" : "accent"}
                indeterminate={item.status === "queued" || (item.status === "processing" && item.progressPercent === 0)}
              />
              <div className="flex items-center justify-between font-mono text-[11px] text-md-text-tertiary">
                <span>
                  {item.status === "processing" ? (
                    <span className="flex items-center gap-1 text-md-warning">
                      <Loader2 size={11} className="animate-spin" /> Merging audio &amp; video…
                    </span>
                  ) : item.status === "queued" ? (
                    "Waiting for a free slot…"
                  ) : (
                    <>
                      <AnimatedCounter value={item.progressPercent} decimals={1} suffix="%" /> ·{" "}
                      {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
                    </>
                  )}
                </span>
                {item.status === "downloading" && (
                  <span>
                    {formatSpeed(item.speedBytesPerSec)} · ETA {formatEta(item.etaSeconds)}
                  </span>
                )}
              </div>
            </div>
          )}

          {item.status === "completed" && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-md-success">
                <CheckmarkDraw /> Saved {formatBytes(item.fileSizeBytes)}
              </span>
              <span className="text-xs text-md-text-tertiary">· {formatRelativeDate(item.completedAt)}</span>
            </div>
          )}

          {item.status === "failed" && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-md-danger">
              <FileWarning size={13} />
              <span className="truncate">{item.errorMessage ?? "Something went wrong."}</span>
            </div>
          )}

          {item.status === "canceled" && <p className="mt-2 text-xs text-md-text-tertiary">Canceled by you.</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isActive && (
              <Button variant="outline" size="sm" leftIcon={<X size={13} />} onClick={() => cancel(item.id)}>
                Cancel
              </Button>
            )}
            {item.status === "completed" && item.filePath && (
              <>
                <a href={`/api/downloads/${item.id}/file`} download>
                  <Button variant="primary" size="sm" leftIcon={<FolderOpen size={13} />}>
                    Open file
                  </Button>
                </a>
                <Button variant="outline" size="sm" leftIcon={<Copy size={13} />} onClick={() => void copyPath()}>
                  {copied ? "Copied!" : "Copy path"}
                </Button>
              </>
            )}
            {item.status === "failed" && (
              <>
                <Button variant="primary" size="sm" leftIcon={<RotateCw size={13} />} onClick={() => retry(item.id)}>
                  Retry
                </Button>
                {item.errorLog && (
                  <Button variant="ghost" size="sm" rightIcon={<ChevronDown size={13} className={logOpen ? "rotate-180" : ""} />} onClick={() => setLogOpen((v) => !v)}>
                    {logOpen ? "Hide log" : "Show log"}
                  </Button>
                )}
              </>
            )}
            {isTerminal && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Trash2 size={13} />}
                onClick={() => remove(item.id, false)}
                className="ml-auto text-md-text-tertiary"
              >
                Remove
              </Button>
            )}
          </div>

          <AnimatePresence>
            {logOpen && item.errorLog && (
              <motion.pre
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 max-h-40 overflow-auto rounded-[var(--md-radius-sm)] bg-black/40 p-2.5 font-mono text-[11px] leading-relaxed text-md-text-tertiary"
              >
                {item.errorLog}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function StatusPill({ item }: { item: DownloadItem }) {
  const toneMap: Record<DownloadItem["status"], "neutral" | "accent" | "success" | "warning" | "danger"> = {
    queued: "neutral",
    fetching_metadata: "neutral",
    downloading: "accent",
    processing: "warning",
    completed: "success",
    failed: "danger",
    canceled: "neutral",
  };

  const icon =
    item.status === "completed" ? (
      <Check size={11} />
    ) : item.status === "failed" ? (
      <CircleX size={11} />
    ) : item.status === "downloading" || item.status === "processing" ? (
      <Loader2 size={11} className="animate-spin" />
    ) : undefined;

  return (
    <Badge tone={toneMap[item.status]} icon={icon} className="shrink-0">
      {STATUS_LABEL[item.status]}
    </Badge>
  );
}
