"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, HardDrive, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SystemStatus } from "@/types/settings";
import { useUIStore } from "@/store/uiStore";

export function BinaryStatusPanel() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const pushToast = useUIStore((s) => s.pushToast);

  function load() {
    setLoading(true);
    fetch("/api/system/status")
      .then((res) => res.json())
      .then(setStatus)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function checkForUpdates() {
    setUpdating(true);
    try {
      const res = await fetch("/api/system/status", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        pushToast({ title: "yt-dlp update check complete", description: data.message || "Already up to date.", variant: "success" });
      } else {
        pushToast({ title: "Update check failed", description: data.error ?? data.message, variant: "error" });
      }
    } finally {
      setUpdating(false);
      load();
    }
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-md-text-primary">Engine status</p>
        <Button variant="ghost" size="sm" leftIcon={<RefreshCw size={13} className={loading ? "animate-spin" : ""} />} onClick={load}>
          Refresh
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-2.5">
        {(["ytDlp", "ffmpeg"] as const).map((key) => {
          const bin = status?.[key];
          const label = key === "ytDlp" ? "yt-dlp" : "ffmpeg";
          return (
            <div key={key} className="flex items-center justify-between rounded-[var(--md-radius-md)] border border-md-border bg-md-surface-2 px-3 py-2.5">
              <div className="flex items-center gap-2.5">
                {bin?.installed ? (
                  <CheckCircle2 size={16} className="text-md-success" />
                ) : (
                  <XCircle size={16} className="text-md-danger" />
                )}
                <div>
                  <p className="text-[13px] font-medium text-md-text-primary">{label}</p>
                  <p className="font-mono text-[11px] text-md-text-tertiary">
                    {bin?.installed ? bin.version ?? "installed" : bin?.error ?? "Not found"}
                  </p>
                </div>
              </div>
              {key === "ytDlp" && bin?.installed && (
                <Button variant="outline" size="sm" isLoading={updating} onClick={() => void checkForUpdates()}>
                  Check for updates
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-md-text-tertiary">
        <HardDrive size={12} />
        <span className="truncate font-mono">{status?.storageRoot ?? "…"}</span>
      </div>
    </Card>
  );
}
