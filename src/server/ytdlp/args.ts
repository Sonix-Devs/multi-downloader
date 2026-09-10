import type { StartDownloadPayload } from "@/types/download";

export const PROGRESS_MARKER = "@MDL-PROGRESS@";
export const POSTPROCESS_MARKER = "@MDL-POSTPROCESS@";

/**
 * Builds the full yt-dlp CLI argument list for a given download request.
 * Pure & deterministic so it can be unit tested without spawning a process.
 */
export function buildDownloadArgs(payload: StartDownloadPayload, outputTemplate: string): string[] {
  const args = [
    "--newline",
    "--no-warnings",
    "--no-playlist",
    "--no-color",
    "--progress-delta",
    "0.75",
    "--progress-template",
    `download:${PROGRESS_MARKER}%(progress)j`,
    "--progress-template",
    `postprocess:${POSTPROCESS_MARKER}%(progress)j`,
    "-o",
    outputTemplate,
  ];

  if (payload.audioOnly) {
    const fmt = payload.audioFormat === "none" ? "mp3" : payload.audioFormat;
    args.push("-f", "bestaudio/best", "-x", "--audio-format", fmt);
    if (fmt !== "wav" && payload.audioBitrateKbps) {
      args.push("--audio-quality", `${payload.audioBitrateKbps}K`);
    }
  } else {
    const selector = payload.formatId || "bestvideo+bestaudio/best";
    args.push("-f", selector, "--merge-output-format", "mp4");
  }

  args.push(payload.url);
  return args;
}

interface RawProgressPayload {
  status?: string;
  downloaded_bytes?: number | null;
  total_bytes?: number | null;
  total_bytes_estimate?: number | null;
  speed?: number | null;
  eta?: number | null;
}

export interface ParsedProgress {
  percent: number;
  downloadedBytes: number;
  totalBytes: number | null;
  speedBytesPerSec: number | null;
  etaSeconds: number | null;
}

/** Parses one `%(progress)j` JSON payload into normalized progress numbers. */
export function parseProgressPayload(jsonText: string, phase: "downloading" | "processing"): ParsedProgress | null {
  let parsed: RawProgressPayload;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }

  const total = parsed.total_bytes ?? parsed.total_bytes_estimate ?? null;
  const downloaded = parsed.downloaded_bytes ?? 0;
  const percent = total && total > 0 ? Math.min(100, (downloaded / total) * 100) : phase === "processing" ? 100 : 0;

  return {
    percent,
    downloadedBytes: downloaded,
    totalBytes: total,
    speedBytesPerSec: parsed.speed ?? null,
    etaSeconds: parsed.eta ?? null,
  };
}
