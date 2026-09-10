import { create } from "zustand";
import type { AppSettings } from "@/types/settings";

interface SettingsState {
  settings: AppSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetch: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

const FALLBACK: AppSettings = {
  defaultSaveDir: "Multi Downloader",
  defaultQualityLabel: "1080p",
  defaultAudioOnly: false,
  defaultAudioFormat: "mp3",
  defaultAudioBitrateKbps: 192,
  concurrentDownloadLimit: 3,
  rememberLastChoice: true,
  autoOpenOnComplete: false,
  theme: "system",
  notifyOnComplete: true,
  clipboardAutoDetect: true,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  loading: false,
  saving: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings.");
      const data = (await res.json()) as { settings: AppSettings };
      set({ settings: data.settings, loading: false });
    } catch (e) {
      set({ settings: FALLBACK, loading: false, error: e instanceof Error ? e.message : "Failed to load settings." });
    }
  },

  update: async (patch) => {
    const previous = get().settings ?? FALLBACK;
    set({ settings: { ...previous, ...patch }, saving: true });
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Failed to save settings.");
      const data = (await res.json()) as { settings: AppSettings };
      set({ settings: data.settings, saving: false });
    } catch (e) {
      set({ settings: previous, saving: false, error: e instanceof Error ? e.message : "Failed to save settings." });
    }
  },
}));
