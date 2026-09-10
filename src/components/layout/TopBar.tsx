"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import type { SystemStatus } from "@/types/settings";
import { useSettingsStore } from "@/store/settingsStore";
import { cn } from "@/lib/cn";

const THEME_ICON = { light: Sun, dark: Moon, system: Monitor } as const;

export function TopBar({ title, description }: { title: string; description?: string }) {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = () => {
      fetch("/api/system/status")
        .then((res) => res.json())
        .then((data) => {
          if (mounted) setStatus(data);
        })
        .catch(() => undefined);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const theme = settings?.theme ?? "system";
  const ThemeIcon = THEME_ICON[theme];

  function cycleTheme() {
    const order: (typeof theme)[] = ["dark", "light", "system"];
    const next = order[(order.indexOf(theme) + 1) % order.length];
    void update({ theme: next });
  }

  const ready = Boolean(status?.ytDlp.installed && status?.ffmpeg.installed);

  return (
    <header className="md-app-drag flex flex-wrap items-center justify-between gap-2 border-b border-md-border bg-md-bg-elevated px-4 py-3 sm:px-6 sm:py-4">
      <div className="md-app-no-drag min-w-0">
        <h1 className="truncate text-base font-semibold text-md-text-primary sm:text-lg">{title}</h1>
        {description && <p className="mt-0.5 hidden text-[13px] text-md-text-secondary sm:block">{description}</p>}
      </div>

      <div className="md-app-no-drag flex shrink-0 items-center gap-2 sm:gap-3">
        <div
          className={cn(
            "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium sm:flex",
            ready ? "border-md-success/30 bg-md-success-soft text-md-success" : "border-md-warning/30 bg-md-warning-soft text-md-warning",
          )}
          title={ready ? "yt-dlp and ffmpeg are ready" : "Some engine binaries are unavailable"}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", ready ? "bg-md-success" : "bg-md-warning")} />
          {ready ? "Engine ready" : "Engine issue"}
        </div>

        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full sm:hidden",
            ready ? "bg-md-success" : "bg-md-warning",
          )}
          title={ready ? "yt-dlp and ffmpeg are ready" : "Some engine binaries are unavailable"}
        />

        <button
          type="button"
          onClick={cycleTheme}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-md-border text-md-text-secondary hover:bg-md-surface-2 hover:text-md-text-primary"
          title={`Theme: ${theme}`}
          aria-label="Cycle theme"
        >
          <ThemeIcon size={15} />
        </button>
      </div>
    </header>
  );
}
