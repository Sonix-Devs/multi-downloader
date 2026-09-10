import type { DownloadRow } from "@/db/schema";
import type { DownloadItem } from "@/types/download";

export function toDownloadItem(row: DownloadRow): DownloadItem {
  return {
    id: row.id,
    url: row.url,
    platform: row.platform,
    title: row.title,
    creator: row.creator,
    thumbnailUrl: row.thumbnailUrl,
    durationSeconds: row.durationSeconds,
    viewCount: row.viewCount,
    formatId: row.formatId,
    qualityLabel: row.qualityLabel,
    audioOnly: row.audioOnly,
    audioFormat: row.audioFormat,
    audioBitrateKbps: row.audioBitrateKbps,
    status: row.status,
    progressPercent: row.progressPercent,
    speedBytesPerSec: row.speedBytesPerSec,
    etaSeconds: row.etaSeconds,
    totalBytes: row.totalBytes,
    downloadedBytes: row.downloadedBytes,
    saveDir: row.saveDir,
    fileName: row.fileName,
    filePath: row.filePath,
    fileSizeBytes: row.fileSizeBytes,
    errorMessage: row.errorMessage,
    errorLog: row.errorLog,
    attempts: row.attempts,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}
