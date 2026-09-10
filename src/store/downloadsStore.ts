import { create } from "zustand";
import type { DownloadItem, DownloadProgressEvent, StartDownloadPayload } from "@/types/download";

const ACTIVE_STATUSES = new Set(["queued", "fetching_metadata", "downloading", "processing"]);

interface DownloadsState {
  items: DownloadItem[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  fetchAll: () => Promise<void>;
  start: (payload: StartDownloadPayload) => Promise<DownloadItem | null>;
  cancel: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  remove: (id: string, removeFile: boolean) => Promise<void>;
  connect: (id: string) => void;
}

const sources = new Map<string, EventSource>();

function upsert(items: DownloadItem[], next: DownloadItem): DownloadItem[] {
  const idx = items.findIndex((i) => i.id === next.id);
  if (idx === -1) return [next, ...items];
  const copy = items.slice();
  copy[idx] = next;
  return copy;
}

function patchItem(items: DownloadItem[], id: string, patch: Partial<DownloadItem>): DownloadItem[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item));
}

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  items: [],
  loaded: false,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/downloads");
      if (!res.ok) throw new Error("Failed to load downloads.");
      const data = (await res.json()) as { downloads: DownloadItem[] };
      set({ items: data.downloads, loaded: true, loading: false });
      for (const item of data.downloads) {
        if (ACTIVE_STATUSES.has(item.status)) {
          get().connect(item.id);
        }
      }
    } catch (e) {
      set({ loading: false, error: e instanceof Error ? e.message : "Failed to load downloads." });
    }
  },

  start: async (payload) => {
    try {
      const res = await fetch("/api/downloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Failed to start download." }));
        throw new Error(body.error ?? "Failed to start download.");
      }
      const data = (await res.json()) as { download: DownloadItem };
      set((state) => ({ items: upsert(state.items, data.download) }));
      get().connect(data.download.id);
      return data.download;
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Failed to start download." });
      return null;
    }
  },

  cancel: async (id) => {
    set((state) => ({ items: patchItem(state.items, id, { status: "canceled" }) }));
    await fetch(`/api/downloads/${id}/cancel`, { method: "POST" }).catch(() => undefined);
  },

  retry: async (id) => {
    set((state) => ({
      items: patchItem(state.items, id, {
        status: "queued",
        progressPercent: 0,
        errorMessage: null,
        errorLog: null,
        speedBytesPerSec: null,
        etaSeconds: null,
      }),
    }));
    const res = await fetch(`/api/downloads/${id}/retry`, { method: "POST" });
    if (res.ok) get().connect(id);
  },

  remove: async (id, removeFile) => {
    const source = sources.get(id);
    if (source) {
      source.close();
      sources.delete(id);
    }
    set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
    await fetch(`/api/downloads/${id}?removeFile=${removeFile ? "true" : "false"}`, { method: "DELETE" }).catch(
      () => undefined,
    );
  },

  connect: (id) => {
    if (sources.has(id)) return;
    const source = new EventSource(`/api/downloads/${id}/events`);
    sources.set(id, source);

    source.addEventListener("snapshot", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as DownloadItem;
      set((state) => ({ items: upsert(state.items, data) }));
    });

    source.addEventListener("progress", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as DownloadProgressEvent;
      set((state) => ({
        items: patchItem(state.items, data.id, {
          status: data.status,
          progressPercent: data.progressPercent,
          speedBytesPerSec: data.speedBytesPerSec,
          etaSeconds: data.etaSeconds,
          totalBytes: data.totalBytes,
          downloadedBytes: data.downloadedBytes,
          fileName: data.fileName ?? undefined,
          filePath: data.filePath ?? undefined,
          fileSizeBytes: data.fileSizeBytes ?? undefined,
          errorMessage: data.errorMessage ?? undefined,
          errorLog: data.errorLog ?? undefined,
          completedAt: data.completedAt ?? undefined,
        }),
      }));
      if (data.status === "completed" || data.status === "failed" || data.status === "canceled") {
        source.close();
        sources.delete(id);
      }
    });

    source.onerror = () => {
      source.close();
      sources.delete(id);
    };
  },
}));

export function selectActiveDownloads(items: DownloadItem[]): DownloadItem[] {
  return items
    .filter((i) => ACTIVE_STATUSES.has(i.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function selectHistoryDownloads(items: DownloadItem[]): DownloadItem[] {
  return items.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
