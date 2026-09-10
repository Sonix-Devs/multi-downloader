import { mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Every download is written beneath this sandboxed root. The in-app "folder
 * picker" only ever browses inside it, which keeps the (web-hosted) server
 * safe from path traversal while still giving users nested folders,
 * per-download overrides, and a "default save location" concept — the
 * closest equivalent to a native OS folder dialog we can offer safely from
 * a server process.
 */
export const STORAGE_ROOT = path.resolve(
  process.env.MULTI_DOWNLOADER_ROOT ?? path.join(/* turbopackIgnore: true */ process.cwd(), "storage", "downloads"),
);

export function ensureStorageRoot(): void {
  if (!existsSync(STORAGE_ROOT)) {
    mkdirSync(STORAGE_ROOT, { recursive: true });
  }
}

export class UnsafePathError extends Error {
  constructor(relPath: string) {
    super(`Refusing to access path outside the sandboxed storage root: ${relPath}`);
    this.name = "UnsafePathError";
  }
}

/** Normalizes a user-supplied relative directory and guarantees it resolves within STORAGE_ROOT. */
export function resolveSafe(relPath: string): string {
  ensureStorageRoot();
  const cleaned = (relPath || ".").split(path.sep).join("/");
  const absolute = path.resolve(STORAGE_ROOT, cleaned);
  const relativeToRoot = path.relative(STORAGE_ROOT, absolute);
  if (relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new UnsafePathError(relPath);
  }
  return absolute;
}

export interface DirEntryInfo {
  name: string;
  relativePath: string;
}

export function listDirectories(relPath: string): DirEntryInfo[] {
  const absolute = resolveSafe(relPath);
  if (!existsSync(absolute)) return [];
  return readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => ({
      name: entry.name,
      relativePath: path.posix.join(relPath === "." ? "" : relPath, entry.name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function createDirectory(relPath: string, name: string): DirEntryInfo {
  const safeName = name.trim().replace(/[/\\?%*:|"<>]/g, "-").slice(0, 80);
  if (!safeName) throw new Error("Folder name cannot be empty.");
  const parent = resolveSafe(relPath);
  const target = path.join(parent, safeName);
  const relativeToRoot = path.relative(STORAGE_ROOT, target);
  if (relativeToRoot.startsWith("..")) throw new UnsafePathError(relPath);
  mkdirSync(target, { recursive: true });
  return { name: safeName, relativePath: path.posix.join(relPath === "." ? "" : relPath, safeName) };
}

export function ensureDir(relPath: string): string {
  const absolute = resolveSafe(relPath);
  if (!existsSync(absolute)) {
    mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}

/** Finds files in `dir` whose name starts with `baseName.` (used to locate yt-dlp's final output). */
export function findProducedFiles(absoluteDir: string, baseName: string): string[] {
  if (!existsSync(absoluteDir)) return [];
  const prefix = `${baseName}.`;
  return readdirSync(absoluteDir)
    .filter((f) => f.startsWith(prefix) && !f.endsWith(".part") && !f.endsWith(".ytdl") && !f.endsWith(".ytdl.part"))
    .map((f) => path.join(absoluteDir, f));
}

export function fileSizeSafe(absolutePath: string): number | null {
  try {
    return statSync(absolutePath).size;
  } catch {
    return null;
  }
}

/** Produces a unique base name (no extension) within a directory, appending " (n)" on collisions. */
export function uniqueBaseName(absoluteDir: string, desiredBaseName: string): string {
  if (!existsSync(absoluteDir)) return desiredBaseName;
  const existing = new Set(readdirSync(absoluteDir).map((f) => f.toLowerCase()));
  const collides = (base: string) => {
    for (const f of existing) {
      if (f.startsWith(`${base.toLowerCase()}.`)) return true;
    }
    return false;
  };
  if (!collides(desiredBaseName)) return desiredBaseName;
  let n = 1;
  while (collides(`${desiredBaseName} (${n})`)) n += 1;
  return `${desiredBaseName} (${n})`;
}
