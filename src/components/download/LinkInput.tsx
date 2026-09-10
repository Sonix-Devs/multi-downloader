"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ClipboardPaste, Loader2, Search, X } from "lucide-react";
import type { PlatformMatch } from "@/types/platform";
import { PlatformBadge } from "./PlatformBadge";
import { kindLabel } from "@/lib/platform/detect";

interface LinkInputProps {
  value: string;
  onChange: (value: string) => void;
  detected: PlatformMatch | null;
  isChecking: boolean;
  errorMessage: string | null;
  clipboardSuggestion: string | null;
  onAcceptClipboard: () => void;
  onDismissClipboard: () => void;
}

export function LinkInput({
  value,
  onChange,
  detected,
  isChecking,
  errorMessage,
  clipboardSuggestion,
  onAcceptClipboard,
  onDismissClipboard,
}: LinkInputProps) {
  return (
    <div className="w-full">
      <div
        className={`group flex items-center gap-3 rounded-[var(--md-radius-lg)] border bg-md-surface px-4 py-3.5 transition-colors duration-200 ${
          errorMessage ? "border-md-danger/60" : "border-md-border focus-within:border-md-accent"
        }`}
      >
        <Search className="shrink-0 text-md-text-tertiary" size={18} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste a YouTube, TikTok, Instagram, X, or any supported link…"
          spellCheck={false}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-md-text-primary placeholder:text-md-text-tertiary focus:outline-none"
        />

        <AnimatePresence mode="popLayout">
          {isChecking && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="animate-spin text-md-text-tertiary" size={18} />
            </motion.div>
          )}
          {!isChecking && detected && (
            <motion.div
              key="badge"
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <span className="hidden text-xs font-medium text-md-text-secondary sm:inline">
                {kindLabel(detected.kind)}
              </span>
              <PlatformBadge platform={detected.platform} size="sm" />
            </motion.div>
          )}
          {value.length > 0 && (
            <motion.button
              key="clear"
              type="button"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              onClick={() => onChange("")}
              className="shrink-0 rounded-full p-1 text-md-text-tertiary hover:bg-md-surface-2 hover:text-md-text-primary"
              aria-label="Clear input"
            >
              <X size={15} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="min-h-[28px] px-1 pt-2">
        <AnimatePresence mode="wait">
          {errorMessage ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[13px] text-md-danger"
            >
              {errorMessage}
            </motion.p>
          ) : clipboardSuggestion ? (
            <motion.div
              key="clipboard"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 text-[13px] text-md-text-secondary"
            >
              <ClipboardPaste size={14} className="text-md-accent" />
              <span className="truncate">Found a link on your clipboard.</span>
              <button
                type="button"
                onClick={onAcceptClipboard}
                className="font-semibold text-md-accent-strong hover:underline"
              >
                Paste it?
              </button>
              <button type="button" onClick={onDismissClipboard} className="text-md-text-tertiary hover:text-md-text-primary">
                Dismiss
              </button>
            </motion.div>
          ) : (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[13px] text-md-text-tertiary">
              Supports YouTube, TikTok, Instagram, X/Twitter, Facebook, Reddit, Twitch, Vimeo, SoundCloud &amp; Pinterest.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
