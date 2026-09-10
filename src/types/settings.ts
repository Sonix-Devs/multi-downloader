import type { AudioFormat } from "./download";

export type ThemePreference = "light" | "dark" | "system";

export interface AppSettings {
  defaultSaveDir: string;
  defaultQualityLabel: string;
  defaultAudioOnly: boolean;
  defaultAudioFormat: AudioFormat;
  defaultAudioBitrateKbps: number;
  concurrentDownloadLimit: number;
  rememberLastChoice: boolean;
  autoOpenOnComplete: boolean;
  theme: ThemePreference;
  notifyOnComplete: boolean;
  clipboardAutoDetect: boolean;
}

export interface BinaryStatus {
  name: "yt-dlp" | "ffmpeg";
  installed: boolean;
  version: string | null;
  path: string | null;
  error?: string;
}

export interface SystemStatus {
  ytDlp: BinaryStatus;
  ffmpeg: BinaryStatus;
  storageRoot: string;
}
