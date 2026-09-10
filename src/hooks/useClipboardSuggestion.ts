"use client";

import { useCallback, useEffect, useState } from "react";
import { detectPlatform } from "@/lib/platform/detect";

/**
 * Watches for a supported link sitting on the clipboard when the app gains
 * focus, offering a one-click "Paste from clipboard?" suggestion instead of
 * intrusively auto-filling the input.
 */
export function useClipboardSuggestion(enabled: boolean, currentValue: string) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!enabled) return;
    if (currentValue.trim().length > 0) return;
    if (typeof navigator === "undefined" || !navigator.clipboard?.readText) return;
    try {
      const text = await navigator.clipboard.readText();
      const trimmed = text.trim();
      if (!trimmed || trimmed === dismissed) return;
      const match = detectPlatform(trimmed);
      if (match) {
        setSuggestion(match.url);
      }
    } catch {
      // Clipboard permission denied or unavailable — fail silently.
    }
  }, [enabled, currentValue, dismissed]);

  useEffect(() => {
    void check();
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [check]);

  const dismiss = useCallback(() => {
    if (suggestion) setDismissed(suggestion);
    setSuggestion(null);
  }, [suggestion]);

  const accept = useCallback(() => {
    const value = suggestion;
    setSuggestion(null);
    return value;
  }, [suggestion]);

  return { suggestion, dismiss, accept };
}
