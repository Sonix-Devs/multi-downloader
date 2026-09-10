"use client";

import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { DownloadQueue } from "@/components/download/DownloadQueue";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { useDownloadsStore, selectHistoryDownloads } from "@/store/downloadsStore";
import { useUIStore } from "@/store/uiStore";
import type { DownloadStatus } from "@/types/download";

type FilterValue = "all" | "completed" | "failed" | "active";

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

const ACTIVE_STATUSES: DownloadStatus[] = ["queued", "fetching_metadata", "downloading", "processing"];

export default function HistoryPage() {
  const items = useDownloadsStore((s) => s.items);
  const remove = useDownloadsStore((s) => s.remove);
  const pushToast = useUIStore((s) => s.pushToast);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [query, setQuery] = useState("");

  const history = useMemo(() => selectHistoryDownloads(items), [items]);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      if (filter === "completed" && item.status !== "completed") return false;
      if (filter === "failed" && item.status !== "failed") return false;
      if (filter === "active" && !ACTIVE_STATUSES.includes(item.status)) return false;
      if (query.trim()) {
        const haystack = `${item.title ?? ""} ${item.creator ?? ""} ${item.url}`.toLowerCase();
        if (!haystack.includes(query.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [history, filter, query]);

  const clearable = history.filter((item) => !ACTIVE_STATUSES.includes(item.status));

  async function clearFinished() {
    await Promise.all(clearable.map((item) => remove(item.id, false)));
    pushToast({ title: "History cleared", description: `Removed ${clearable.length} entries`, variant: "info" });
  }

  return (
    <>
      <TopBar title="History" description="Every download you've started, in one place" />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl value={filter} onChange={setFilter} options={FILTERS} />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-[var(--md-radius-md)] border border-md-border bg-md-surface px-3 py-1.5">
                <Search size={14} className="text-md-text-tertiary" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search history…"
                  className="w-44 bg-transparent text-sm text-md-text-primary placeholder:text-md-text-tertiary focus:outline-none"
                />
              </div>
              <Button variant="outline" size="sm" leftIcon={<Trash2 size={13} />} onClick={() => void clearFinished()} disabled={clearable.length === 0}>
                Clear finished
              </Button>
            </div>
          </div>

          <DownloadQueue
            items={filtered}
            emptyTitle="No downloads yet"
            emptyDescription="Downloads you start will show up here with full history."
          />
        </div>
      </div>
    </>
  );
}
