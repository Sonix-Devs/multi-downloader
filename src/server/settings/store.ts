import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import type { AppSettings } from "@/types/settings";

const DEFAULTS: AppSettings = {
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

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  if (rows.length === 0) {
    await db.insert(settings).values({ id: 1, ...DEFAULTS }).onConflictDoNothing();
    return DEFAULTS;
  }
  const row = rows[0];
  return {
    defaultSaveDir: row.defaultSaveDir,
    defaultQualityLabel: row.defaultQualityLabel,
    defaultAudioOnly: row.defaultAudioOnly,
    defaultAudioFormat: row.defaultAudioFormat,
    defaultAudioBitrateKbps: row.defaultAudioBitrateKbps,
    concurrentDownloadLimit: row.concurrentDownloadLimit,
    rememberLastChoice: row.rememberLastChoice,
    autoOpenOnComplete: row.autoOpenOnComplete,
    theme: row.theme,
    notifyOnComplete: row.notifyOnComplete,
    clipboardAutoDetect: row.clipboardAutoDetect,
  };
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const merged = { ...current, ...patch };
  await db
    .insert(settings)
    .values({ id: 1, ...merged })
    .onConflictDoUpdate({ target: settings.id, set: { ...merged, updatedAt: new Date() } });
  return merged;
}
