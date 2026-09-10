"use client";

import { useEffect, useState } from "react";
import { Save, Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { BinaryStatusPanel } from "@/components/settings/BinaryStatusPanel";
import { useSettingsStore } from "@/store/settingsStore";
import { useDownloadsStore } from "@/store/downloadsStore";
import { useUIStore } from "@/store/uiStore";
import type { AudioFormat } from "@/types/download";
import type { ThemePreference } from "@/types/settings";

const QUALITY_PRESETS = ["2160p (4K)", "1440p (2K)", "1080p", "720p", "480p"];
const AUDIO_FORMATS: AudioFormat[] = ["mp3", "m4a", "wav"];
const BITRATES = [128, 192, 256, 320];

export default function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetch);
  const update = useSettingsStore((s) => s.update);
  const items = useDownloadsStore((s) => s.items);
  const remove = useDownloadsStore((s) => s.remove);
  const pushToast = useUIStore((s) => s.pushToast);

  useEffect(() => {
    if (!settings) void fetchSettings();
  }, [settings, fetchSettings]);

  if (!settings) {
    return (
      <>
        <TopBar title="Settings" description="Loading your preferences…" />
        <div className="flex-1 p-6">
          <div className="mx-auto max-w-2xl animate-pulse space-y-4">
            <div className="h-24 rounded-[var(--md-radius-lg)] bg-md-surface-2" />
            <div className="h-24 rounded-[var(--md-radius-lg)] bg-md-surface-2" />
          </div>
        </div>
      </>
    );
  }

  async function clearAllHistory() {
    const terminal = items.filter((i) => ["completed", "failed", "canceled"].includes(i.status));
    await Promise.all(terminal.map((i) => remove(i.id, false)));
    pushToast({ title: "History cleared", variant: "info" });
  }

  return (
    <>
      <TopBar title="Settings" description="Defaults, engine status, and app behavior" />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-5">
          <Card className="p-4">
            <p className="mb-3 text-[13px] font-semibold text-md-text-primary">Default video quality</p>
            <div className="flex flex-wrap gap-2">
              {QUALITY_PRESETS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void update({ defaultQualityLabel: q })}
                  className={`rounded-[var(--md-radius-md)] border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                    settings.defaultQualityLabel === q
                      ? "border-md-accent bg-md-accent-soft text-md-text-primary"
                      : "border-md-border bg-md-surface-2 text-md-text-secondary hover:border-md-border-strong"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-md-border pt-4">
              <span className="text-sm font-medium text-md-text-primary">Default to audio-only</span>
              <Toggle checked={settings.defaultAudioOnly} onChange={(v) => void update({ defaultAudioOnly: v })} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div>
                <p className="mb-2 text-xs font-medium text-md-text-tertiary">Audio codec</p>
                <SegmentedControl
                  value={settings.defaultAudioFormat}
                  onChange={(v) => void update({ defaultAudioFormat: v })}
                  options={AUDIO_FORMATS.map((f) => ({ value: f, label: f.toUpperCase() }))}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-md-text-tertiary">Bitrate (kbps)</p>
                <SegmentedControl
                  value={String(settings.defaultAudioBitrateKbps)}
                  onChange={(v) => void update({ defaultAudioBitrateKbps: Number(v) })}
                  options={BITRATES.map((b) => ({ value: String(b), label: String(b) }))}
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="mb-3 text-[13px] font-semibold text-md-text-primary">Behavior</p>
            <div className="flex flex-col divide-y divide-md-border">
              <Toggle
                checked={settings.notifyOnComplete}
                onChange={(v) => void update({ notifyOnComplete: v })}
                label="Notify when downloads finish"
                description="Show a toast when a download completes or fails"
              />
              <Toggle
                checked={settings.clipboardAutoDetect}
                onChange={(v) => void update({ clipboardAutoDetect: v })}
                label="Clipboard auto-detect"
                description={'Suggest pasting a supported link found on your clipboard'}
              />
            </div>

            <div className="mt-4 border-t border-md-border pt-4">
              <p className="mb-2 text-sm font-medium text-md-text-primary">Theme</p>
              <SegmentedControl<ThemePreference>
                value={settings.theme}
                onChange={(v) => void update({ theme: v })}
                options={[
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                  { value: "system", label: "System" },
                ]}
              />
            </div>

            <div className="mt-4 border-t border-md-border pt-4">
              <p className="mb-1 text-sm font-medium text-md-text-primary">Concurrent downloads</p>
              <p className="mb-2 text-xs text-md-text-tertiary">How many downloads can run at the same time.</p>
              <SegmentedControl
                value={String(settings.concurrentDownloadLimit)}
                onChange={(v) => void update({ concurrentDownloadLimit: Number(v) })}
                options={["1", "2", "3", "4", "5"].map((n) => ({ value: n, label: n }))}
              />
            </div>
          </Card>

          <BinaryStatusPanel />

          <Card className="border-md-danger/30 p-4">
            <p className="mb-1 text-[13px] font-semibold text-md-danger">Danger zone</p>
            <p className="mb-3 text-xs text-md-text-tertiary">Remove every completed, failed, or canceled entry from history. Files on disk are kept.</p>
            <Button variant="danger" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => void clearAllHistory()}>
              Clear all history
            </Button>
          </Card>

          <p className="flex items-center gap-1.5 pb-4 text-xs text-md-text-tertiary">
            <Save size={12} /> Changes save automatically.
          </p>
        </div>
      </div>
    </>
  );
}
