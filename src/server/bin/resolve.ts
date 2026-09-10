import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import type { BinaryStatus } from "@/types/settings";

/**
 * Resolves external binaries (yt-dlp, ffmpeg) the same way a desktop app
 * would: honor an explicit env override first, fall back to `PATH`, then a
 * short list of well-known install locations. Results are cached in-process
 * since the underlying binaries never move during the server's lifetime.
 */

interface BinarySpec {
  name: "yt-dlp" | "ffmpeg";
  envVar: string;
  posixCandidates: string[];
  win32Candidates: string[];
  versionArgs: string[];
}

const SPECS: Record<"yt-dlp" | "ffmpeg", BinarySpec> = {
  "yt-dlp": {
    name: "yt-dlp",
    envVar: "YTDLP_PATH",
    posixCandidates: ["/usr/local/bin/yt-dlp", "/usr/bin/yt-dlp", "/opt/homebrew/bin/yt-dlp"],
    win32Candidates: ["C:\\yt-dlp\\yt-dlp.exe"],
    versionArgs: ["--version"],
  },
  ffmpeg: {
    name: "ffmpeg",
    envVar: "FFMPEG_PATH",
    posixCandidates: ["/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg", "/opt/homebrew/bin/ffmpeg"],
    win32Candidates: ["C:\\ffmpeg\\bin\\ffmpeg.exe"],
    versionArgs: ["-version"],
  },
};

const cache = new Map<string, { path: string | null; version: string | null; error?: string }>();

function which(binary: string): string | null {
  try {
    const isWin = process.platform === "win32";
    const out = execFileSync(isWin ? "where" : "which", [binary], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const first = out.split(/\r?\n/).map((l) => l.trim()).find(Boolean);
    return first ?? null;
  } catch {
    return null;
  }
}

function tryVersion(binPath: string, args: string[]): string | null {
  try {
    const out = execFileSync(binPath, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return out.split(/\r?\n/)[0]?.trim() ?? null;
  } catch {
    return null;
  }
}

function resolveBinary(spec: BinarySpec): { path: string | null; version: string | null; error?: string } {
  const cached = cache.get(spec.name);
  if (cached) return cached;

  const envPath = process.env[spec.envVar];
  const candidates = [
    ...(envPath ? [envPath] : []),
    ...(process.platform === "win32" ? spec.win32Candidates : spec.posixCandidates),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      const version = tryVersion(candidate, spec.versionArgs);
      const result = { path: candidate, version };
      cache.set(spec.name, result);
      return result;
    }
  }

  const fromPath = which(spec.name);
  if (fromPath) {
    const version = tryVersion(fromPath, spec.versionArgs);
    const result = { path: fromPath, version };
    cache.set(spec.name, result);
    return result;
  }

  const result = {
    path: null,
    version: null,
    error: `${spec.name} was not found on PATH or common install locations. Set ${spec.envVar} to its absolute path.`,
  };
  cache.set(spec.name, result);
  return result;
}

export function resolveYtDlp() {
  return resolveBinary(SPECS["yt-dlp"]);
}

export function resolveFfmpeg() {
  return resolveBinary(SPECS.ffmpeg);
}

export function resetBinaryCache(): void {
  cache.clear();
}

export function getBinaryStatus(name: "yt-dlp" | "ffmpeg"): BinaryStatus {
  const resolved = name === "yt-dlp" ? resolveYtDlp() : resolveFfmpeg();
  return {
    name,
    installed: Boolean(resolved.path),
    version: resolved.version,
    path: resolved.path,
    error: resolved.error,
  };
}

export function ffmpegDir(): string | null {
  const { path: p } = resolveFfmpeg();
  return p ? path.dirname(p) : null;
}
