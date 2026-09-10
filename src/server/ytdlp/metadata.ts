import { execFile, type ExecFileException } from "node:child_process";
import { resolveYtDlp } from "@/server/bin/resolve";
import { detectPlatformOrGeneric } from "@/lib/platform/detect";
import type { ContentMetadata, FormatOption } from "@/types/download";

export class MetadataError extends Error {
  code: "NOT_FOUND" | "UNSUPPORTED" | "PRIVATE" | "TIMEOUT" | "BINARY_MISSING" | "UNKNOWN";

  constructor(message: string, code: MetadataError["code"]) {
    super(message);
    this.name = "MetadataError";
    this.code = code;
  }
}

interface RawFormat {
  format_id: string;
  ext: string;
  height?: number | null;
  fps?: number | null;
  vcodec?: string | null;
  acodec?: string | null;
  filesize?: number | null;
  filesize_approx?: number | null;
  abr?: number | null;
  tbr?: number | null;
  format_note?: string | null;
  protocol?: string | null;
}

interface RawInfo {
  id: string;
  title?: string;
  uploader?: string | null;
  channel?: string | null;
  thumbnail?: string | null;
  thumbnails?: { url: string; height?: number | null; width?: number | null }[];
  duration?: number | null;
  view_count?: number | null;
  upload_date?: string | null;
  is_live?: boolean | null;
  formats?: RawFormat[];
  webpage_url?: string;
  _type?: string;
  entries?: RawInfo[];
}

function friendlyErrorFromStderr(stderr: string): MetadataError {
  const text = stderr.toLowerCase();
  if (text.includes("private video") || text.includes("login required") || text.includes("rate-limited")) {
    return new MetadataError(
      "This content is private, age-restricted, or requires login. It can't be previewed or downloaded.",
      "PRIVATE",
    );
  }
  if (text.includes("unsupported url")) {
    return new MetadataError("This link isn't supported yet.", "UNSUPPORTED");
  }
  if (text.includes("video unavailable") || text.includes("404")) {
    return new MetadataError("We couldn't find that content — it may have been removed.", "NOT_FOUND");
  }
  const firstError = stderr
    .split("\n")
    .find((l) => l.trim().startsWith("ERROR:"));
  return new MetadataError(
    firstError ? firstError.replace(/^ERROR:\s*/, "") : "Failed to read this link. Please double-check the URL.",
    "UNKNOWN",
  );
}

function bestThumbnail(info: RawInfo): string | null {
  if (info.thumbnails && info.thumbnails.length > 0) {
    const sorted = [...info.thumbnails].sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
    return sorted[0]?.url ?? info.thumbnail ?? null;
  }
  return info.thumbnail ?? null;
}

function labelForHeight(height: number): string {
  if (height >= 2160) return `${height}p (4K)`;
  if (height >= 1440) return `${height}p (2K)`;
  return `${height}p`;
}

function buildFormats(info: RawInfo): { formats: FormatOption[]; audioBitrates: number[] } {
  const raw = info.formats ?? [];

  const videoFormats = raw.filter((f) => f.vcodec && f.vcodec !== "none" && f.height);
  const audioFormats = raw.filter((f) => (!f.vcodec || f.vcodec === "none") && f.acodec && f.acodec !== "none");

  const bestAudioSize = audioFormats.reduce<number | null>((best, f) => {
    const size = f.filesize ?? f.filesize_approx ?? null;
    if (size === null) return best;
    if (best === null || size > best) return size;
    return best;
  }, null);

  const byHeight = new Map<number, RawFormat>();
  for (const f of videoFormats) {
    const h = f.height as number;
    const current = byHeight.get(h);
    const currentTbr = current?.tbr ?? 0;
    if (!current || (f.tbr ?? 0) > currentTbr) {
      byHeight.set(h, f);
    }
  }

  const heights = [...byHeight.keys()].sort((a, b) => b - a);
  const formats: FormatOption[] = heights.map((h) => {
    const f = byHeight.get(h)!;
    const ownSize = f.filesize ?? f.filesize_approx ?? null;
    const estimatedTotal = ownSize !== null ? ownSize + (bestAudioSize ?? 0) : null;
    return {
      formatId: `bestvideo[height<=${h}]+bestaudio/best[height<=${h}]`,
      label: labelForHeight(h),
      ext: "mp4",
      height: h,
      fps: f.fps ?? null,
      vcodec: f.vcodec ?? null,
      acodec: f.acodec ?? null,
      filesizeBytes: estimatedTotal,
      isAudioOnly: false,
      abrKbps: null,
      tbrKbps: f.tbr ?? null,
    };
  });

  if (formats.length === 0 && raw.length > 0) {
    // Platform only exposes pre-muxed/opaque formats (common for TikTok/Instagram/Twitter).
    formats.push({
      formatId: "best",
      label: "Best available",
      ext: "mp4",
      height: null,
      fps: null,
      vcodec: null,
      acodec: null,
      filesizeBytes: raw[0]?.filesize ?? raw[0]?.filesize_approx ?? null,
      isAudioOnly: false,
      abrKbps: null,
      tbrKbps: null,
    });
  }

  const audioBitrates = [128, 192, 256, 320];
  return { formats, audioBitrates };
}

function runYtDlp(args: string[], timeoutMs: number): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const { path: bin, error } = resolveYtDlp();
    if (!bin) {
      reject(new MetadataError(error ?? "yt-dlp binary is not installed on this server.", "BINARY_MISSING"));
      return;
    }

    const child = execFile(
      bin,
      args,
      { timeout: timeoutMs, maxBuffer: 1024 * 1024 * 64 },
      (err: ExecFileException | null, stdout, stderr) => {
        if (err) {
          if (err.killed) {
            reject(new MetadataError("Fetching metadata timed out. The source may be slow or unreachable.", "TIMEOUT"));
            return;
          }
          reject(friendlyErrorFromStderr(stderr || String(err)));
          return;
        }
        resolve({ stdout, stderr });
      },
    );
    child.on("error", (e) => reject(new MetadataError(e.message, "UNKNOWN")));
  });
}

const MAX_ATTEMPTS = 2;
const TIMEOUT_MS = 25_000;

export async function fetchMetadata(url: string): Promise<ContentMetadata> {
  const detected = detectPlatformOrGeneric(url);
  if (!detected) {
    throw new MetadataError("That doesn't look like a valid link.", "UNSUPPORTED");
  }

  let lastError: MetadataError | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { stdout } = await runYtDlp(
        ["-J", "--no-warnings", "--no-playlist", "--socket-timeout", "15", detected.url],
        TIMEOUT_MS,
      );
      const info: RawInfo = JSON.parse(stdout);
      const { formats, audioBitrates } = buildFormats(info);

      return {
        url: detected.url,
        platform: detected.platform,
        id: info.id,
        title: info.title?.trim() || "Untitled",
        creator: info.channel ?? info.uploader ?? null,
        thumbnailUrl: bestThumbnail(info),
        durationSeconds: info.duration ?? null,
        viewCount: info.view_count ?? null,
        uploadDate: info.upload_date ?? null,
        isLive: Boolean(info.is_live),
        formats,
        audioBitratesKbps: audioBitrates,
      };
    } catch (e) {
      lastError = e instanceof MetadataError ? e : new MetadataError("Unexpected error while reading this link.", "UNKNOWN");
      if (lastError.code === "PRIVATE" || lastError.code === "UNSUPPORTED" || lastError.code === "BINARY_MISSING") {
        break;
      }
    }
  }

  throw lastError ?? new MetadataError("Failed to fetch metadata.", "UNKNOWN");
}
