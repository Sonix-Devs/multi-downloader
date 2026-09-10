import type { PlatformId } from "./platform";

export type DownloadStatus =
  | "queued"
  | "fetching_metadata"
  | "downloading"
  | "processing"
  | "completed"
  | "failed"
  | "canceled";

export type AudioFormat = "mp3" | "m4a" | "wav" | "none";

export interface FormatOption {
  formatId: string;
  label: string;
  ext: string;
  height: number | null;
  fps: number | null;
  vcodec: string | null;
  acodec: string | null;
  filesizeBytes: number | null;
  isAudioOnly: boolean;
  abrKbps: number | null;
  tbrKbps: number | null;
}

export interface ContentMetadata {
  url: string;
  platform: PlatformId;
  id: string;
  title: string;
  creator: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  uploadDate: string | null;
  isLive: boolean;
  formats: FormatOption[];
  audioBitratesKbps: number[];
}

export interface DownloadItem {
  id: string;
  url: string;
  platform: PlatformId;
  title: string | null;
  creator: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  viewCount: number | null;
  formatId: string | null;
  qualityLabel: string | null;
  audioOnly: boolean;
  audioFormat: AudioFormat;
  audioBitrateKbps: number | null;
  status: DownloadStatus;
  progressPercent: number;
  speedBytesPerSec: number | null;
  etaSeconds: number | null;
  totalBytes: number | null;
  downloadedBytes: number;
  saveDir: string;
  fileName: string | null;
  filePath: string | null;
  fileSizeBytes: number | null;
  errorMessage: string | null;
  errorLog: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface StartDownloadPayload {
  url: string;
  platform: PlatformId;
  title?: string | null;
  creator?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  viewCount?: number | null;
  formatId?: string | null;
  qualityLabel?: string | null;
  audioOnly: boolean;
  audioFormat: AudioFormat;
  audioBitrateKbps?: number | null;
}

export interface DownloadProgressEvent {
  id: string;
  status: DownloadStatus;
  progressPercent: number;
  speedBytesPerSec: number | null;
  etaSeconds: number | null;
  totalBytes: number | null;
  downloadedBytes: number;
  fileName?: string | null;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  errorMessage?: string | null;
  errorLog?: string | null;
  completedAt?: string | null;
}
