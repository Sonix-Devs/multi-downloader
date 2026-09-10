"use client";

import { motion } from "framer-motion";
import { Music4, Video } from "lucide-react";
import type { AudioFormat, ContentMetadata } from "@/types/download";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { formatBytes } from "@/lib/format";

export interface QualitySelection {
  audioOnly: boolean;
  formatId: string | null;
  qualityLabel: string | null;
  audioFormat: AudioFormat;
  audioBitrateKbps: number;
}

const AUDIO_FORMATS: AudioFormat[] = ["mp3", "m4a", "wav"];

export function QualitySelector({
  metadata,
  selection,
  onChange,
}: {
  metadata: ContentMetadata;
  selection: QualitySelection;
  onChange: (next: QualitySelection) => void;
}) {
  const videoFormats = metadata.formats;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="rounded-[var(--md-radius-lg)] border border-md-border bg-md-surface p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-md-text-primary">Format</p>
        <SegmentedControl
          value={selection.audioOnly ? "audio" : "video"}
          onChange={(v) => onChange({ ...selection, audioOnly: v === "audio" })}
          options={[
            { value: "video", label: "Video", icon: <Video size={13} /> },
            { value: "audio", label: "Audio only", icon: <Music4 size={13} /> },
          ]}
        />
      </div>

      {!selection.audioOnly && (
        <div className="mt-3.5">
          <p className="mb-2 text-xs font-medium text-md-text-tertiary">Quality</p>
          <div className="flex flex-wrap gap-2">
            {videoFormats.map((f) => {
              const active = f.formatId === selection.formatId;
              return (
                <button
                  key={f.formatId}
                  type="button"
                  onClick={() => onChange({ ...selection, formatId: f.formatId, qualityLabel: f.label })}
                  className={`flex flex-col items-start rounded-[var(--md-radius-md)] border px-3 py-2 text-left transition-colors ${
                    active
                      ? "border-md-accent bg-md-accent-soft text-md-text-primary"
                      : "border-md-border bg-md-surface-2 text-md-text-secondary hover:border-md-border-strong"
                  }`}
                >
                  <span className="text-[13px] font-semibold">{f.label}</span>
                  <span className="text-[11px] text-md-text-tertiary">{formatBytes(f.filesizeBytes)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selection.audioOnly && (
        <div className="mt-3.5 flex flex-wrap items-end gap-4">
          <div>
            <p className="mb-2 text-xs font-medium text-md-text-tertiary">Codec</p>
            <div className="flex gap-2">
              {AUDIO_FORMATS.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onChange({ ...selection, audioFormat: fmt })}
                  className={`rounded-[var(--md-radius-md)] border px-3 py-1.5 text-[13px] font-semibold uppercase transition-colors ${
                    selection.audioFormat === fmt
                      ? "border-md-accent bg-md-accent-soft text-md-text-primary"
                      : "border-md-border bg-md-surface-2 text-md-text-secondary hover:border-md-border-strong"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {selection.audioFormat !== "wav" && (
            <div>
              <p className="mb-2 text-xs font-medium text-md-text-tertiary">Bitrate</p>
              <div className="flex gap-2">
                {metadata.audioBitratesKbps.map((kbps) => (
                  <button
                    key={kbps}
                    type="button"
                    onClick={() => onChange({ ...selection, audioBitrateKbps: kbps })}
                    className={`rounded-[var(--md-radius-md)] border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                      selection.audioBitrateKbps === kbps
                        ? "border-md-accent bg-md-accent-soft text-md-text-primary"
                        : "border-md-border bg-md-surface-2 text-md-text-secondary hover:border-md-border-strong"
                    }`}
                  >
                    {kbps}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
