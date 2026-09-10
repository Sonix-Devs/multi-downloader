"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download as DownloadIcon, ListChecks } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { LinkInput } from "@/components/download/LinkInput";
import { PreviewCard, PreviewCardError, PreviewCardSkeleton } from "@/components/download/PreviewCard";
import { QualitySelector, type QualitySelection } from "@/components/download/QualitySelector";
import { DownloadQueue } from "@/components/download/DownloadQueue";
import { Button } from "@/components/ui/Button";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useClipboardSuggestion } from "@/hooks/useClipboardSuggestion";
import { detectPlatformOrGeneric } from "@/lib/platform/detect";
import { useDownloadsStore, selectActiveDownloads } from "@/store/downloadsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useUIStore } from "@/store/uiStore";
import type { ContentMetadata, StartDownloadPayload } from "@/types/download";

type MetaState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: ContentMetadata };

export default function HomePage() {
  const [url, setUrl] = useState("");
  const debouncedUrl = useDebouncedValue(url, 300);
  const [metaState, setMetaState] = useState<MetaState>({ status: "idle" });
  const [selection, setSelection] = useState<QualitySelection | null>(null);
  const [starting, setStarting] = useState(false);
  const requestId = useRef(0);

  const settings = useSettingsStore((s) => s.settings);
  const items = useDownloadsStore((s) => s.items);
  const start = useDownloadsStore((s) => s.start);
  const pushToast = useUIStore((s) => s.pushToast);

  const activeItems = useMemo(() => selectActiveDownloads(items), [items]);
  const instantDetected = useMemo(() => detectPlatformOrGeneric(url), [url]);

  const clipboard = useClipboardSuggestion(settings?.clipboardAutoDetect ?? true, url);

  useEffect(() => {
    const trimmed = debouncedUrl.trim();
    if (!trimmed) {
      setMetaState({ status: "idle" });
      return;
    }
    const detected = detectPlatformOrGeneric(trimmed);
    if (!detected) {
      setMetaState({ status: "idle" });
      return;
    }

    const myRequest = ++requestId.current;
    setMetaState({ status: "loading" });

    fetch("/api/metadata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: trimmed }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (myRequest !== requestId.current) return;
        if (!res.ok) {
          setMetaState({ status: "error", message: data.error ?? "Failed to load this link." });
          return;
        }
        const metadata = data.metadata as ContentMetadata;
        setMetaState({ status: "success", data: metadata });
        const defaultFormat =
          metadata.formats.find((f) => f.label === settings?.defaultQualityLabel) ?? metadata.formats[0] ?? null;
        setSelection({
          audioOnly: settings?.defaultAudioOnly ?? false,
          formatId: defaultFormat?.formatId ?? null,
          qualityLabel: defaultFormat?.label ?? null,
          audioFormat: settings?.defaultAudioFormat ?? "mp3",
          audioBitrateKbps: settings?.defaultAudioBitrateKbps ?? 192,
        });
      })
      .catch(() => {
        if (myRequest !== requestId.current) return;
        setMetaState({ status: "error", message: "Network error while reading this link." });
      });
  }, [debouncedUrl, settings]);

  async function handleStart() {
    if (metaState.status !== "success" || !selection) return;
    setStarting(true);
    const payload: StartDownloadPayload = {
      url: metaState.data.url,
      platform: metaState.data.platform,
      title: metaState.data.title,
      creator: metaState.data.creator,
      thumbnailUrl: metaState.data.thumbnailUrl,
      durationSeconds: metaState.data.durationSeconds,
      viewCount: metaState.data.viewCount,
      formatId: selection.audioOnly ? null : selection.formatId,
      qualityLabel: selection.audioOnly ? "Audio only" : selection.qualityLabel,
      audioOnly: selection.audioOnly,
      audioFormat: selection.audioOnly ? selection.audioFormat : "none",
      audioBitrateKbps: selection.audioOnly ? selection.audioBitrateKbps : null,
    };

    const result = await start(payload);
    setStarting(false);

    if (result) {
      pushToast({ title: "Added to download queue", description: metaState.data.title, variant: "success" });
      setUrl("");
      setMetaState({ status: "idle" });
      setSelection(null);
    } else {
      pushToast({ title: "Couldn't start download", description: useDownloadsStore.getState().error ?? undefined, variant: "error" });
    }
  }

  return (
    <>
      <TopBar title="Downloader" description="Paste a link from any supported platform to get started" />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            <LinkInput
              value={url}
              onChange={setUrl}
              detected={instantDetected}
              isChecking={metaState.status === "loading"}
              errorMessage={metaState.status === "error" ? metaState.message : null}
              clipboardSuggestion={clipboard.suggestion}
              onAcceptClipboard={() => {
                const value = clipboard.accept();
                if (value) setUrl(value);
              }}
              onDismissClipboard={clipboard.dismiss}
            />
          </motion.div>

          {metaState.status === "loading" && <PreviewCardSkeleton />}
          {metaState.status === "error" && (
            <PreviewCardError message={metaState.message} onRetry={() => setMetaState({ status: "idle" })} />
          )}
          {metaState.status === "success" && selection && (
            <div className="flex flex-col gap-4">
              <PreviewCard metadata={metaState.data} />
              <QualitySelector metadata={metaState.data} selection={selection} onChange={setSelection} />
              <Button variant="primary" size="lg" leftIcon={<DownloadIcon size={16} />} isLoading={starting} onClick={() => void handleStart()} className="self-end">
                Start download
              </Button>
            </div>
          )}

          <section className="mt-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-md-text-primary">
              <ListChecks size={16} className="text-md-accent" />
              Active queue
              {activeItems.length > 0 && (
                <span className="rounded-full bg-md-surface-3 px-2 py-0.5 text-xs font-semibold text-md-text-secondary">
                  {activeItems.length}
                </span>
              )}
            </div>
            <DownloadQueue items={activeItems} />
          </section>
        </div>
      </div>
    </>
  );
}
