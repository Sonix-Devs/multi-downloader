import {
  bigint,
  boolean,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Enumerates every source platform Multi Downloader can detect & extract from.
 * Kept in sync with `src/lib/platform/detect.ts`.
 */
export const platformEnum = pgEnum("platform", [
  "youtube",
  "tiktok",
  "instagram",
  "twitter",
  "facebook",
  "reddit",
  "twitch",
  "vimeo",
  "soundcloud",
  "pinterest",
  "generic",
]);

/**
 * Lifecycle states a queued item can move through. Mirrors the state
 * machine implemented in `src/server/downloads/manager.ts`.
 */
export const downloadStatusEnum = pgEnum("download_status", [
  "queued",
  "fetching_metadata",
  "downloading",
  "processing",
  "completed",
  "failed",
  "canceled",
]);

export const audioFormatEnum = pgEnum("audio_format", ["mp3", "m4a", "wav", "none"]);

export const themeEnum = pgEnum("theme_preference", ["light", "dark", "system"]);

export const downloads = pgTable("downloads", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Source
  url: text("url").notNull(),
  platform: platformEnum("platform").notNull().default("generic"),

  // Metadata (populated after yt-dlp -j resolves)
  title: text("title"),
  creator: text("creator"),
  thumbnailUrl: text("thumbnail_url"),
  durationSeconds: doublePrecision("duration_seconds"),
  viewCount: bigint("view_count", { mode: "number" }),

  // Requested format
  formatId: text("format_id"),
  qualityLabel: text("quality_label"),
  audioOnly: boolean("audio_only").notNull().default(false),
  audioFormat: audioFormatEnum("audio_format").notNull().default("none"),
  audioBitrateKbps: integer("audio_bitrate_kbps"),

  // Lifecycle
  status: downloadStatusEnum("status").notNull().default("queued"),
  progressPercent: real("progress_percent").notNull().default(0),
  speedBytesPerSec: doublePrecision("speed_bytes_per_sec"),
  etaSeconds: integer("eta_seconds"),
  totalBytes: bigint("total_bytes", { mode: "number" }),
  downloadedBytes: bigint("downloaded_bytes", { mode: "number" }).notNull().default(0),

  // Output
  saveDir: text("save_dir").notNull(),
  fileName: text("file_name"),
  filePath: text("file_path"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),

  // Errors / diagnostics
  errorMessage: text("error_message"),
  errorLog: text("error_log"),
  attempts: integer("attempts").notNull().default(0),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export type DownloadRow = typeof downloads.$inferSelect;
export type NewDownloadRow = typeof downloads.$inferInsert;

/**
 * Singleton settings row (id is always 1). Using a real table instead of a
 * key/value blob keeps the shape statically typed end-to-end.
 */
export const settings = pgTable("settings", {
  id: integer("id").primaryKey().default(1),
  defaultSaveDir: text("default_save_dir").notNull().default("Multi Downloader"),
  defaultQualityLabel: text("default_quality_label").notNull().default("1080p"),
  defaultAudioOnly: boolean("default_audio_only").notNull().default(false),
  defaultAudioFormat: audioFormatEnum("default_audio_format").notNull().default("mp3"),
  defaultAudioBitrateKbps: integer("default_audio_bitrate_kbps").notNull().default(192),
  concurrentDownloadLimit: integer("concurrent_download_limit").notNull().default(3),
  rememberLastChoice: boolean("remember_last_choice").notNull().default(true),
  autoOpenOnComplete: boolean("auto_open_on_complete").notNull().default(false),
  theme: themeEnum("theme").notNull().default("system"),
  notifyOnComplete: boolean("notify_on_complete").notNull().default(true),
  clipboardAutoDetect: boolean("clipboard_auto_detect").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SettingsRow = typeof settings.$inferSelect;
export type NewSettingsRow = typeof settings.$inferInsert;
