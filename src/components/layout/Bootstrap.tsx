"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useDownloadsStore } from "@/store/downloadsStore";

function applyTheme(theme: "light" | "dark" | "system") {
  const root = document.documentElement;
  if (theme === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

/** Client-only bootstrapper: loads settings + download history once and keeps the theme attribute in sync. */
export function Bootstrap() {
  const settings = useSettingsStore((s) => s.settings);
  const fetchSettings = useSettingsStore((s) => s.fetch);
  const fetchDownloads = useDownloadsStore((s) => s.fetchAll);

  useEffect(() => {
    void fetchSettings();
    void fetchDownloads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const theme = settings?.theme ?? "dark";
    applyTheme(theme);
    if (theme === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = () => applyTheme("system");
      mql.addEventListener("change", listener);
      return () => mql.removeEventListener("change", listener);
    }
    return undefined;
  }, [settings?.theme]);

  return null;
}
