import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

let ROOT: string;

beforeAll(() => {
  ROOT = mkdtempSync(path.join(tmpdir(), "md-sandbox-"));
  process.env.MULTI_DOWNLOADER_ROOT = ROOT;
});

afterAll(() => {
  rmSync(ROOT, { recursive: true, force: true });
});

describe("sandboxed filesystem helpers", () => {
  it("resolves nested relative paths inside the root", async () => {
    const { resolveSafe, STORAGE_ROOT } = await import("@/server/fs/sandbox");
    const resolved = resolveSafe("a/b/c");
    expect(resolved.startsWith(STORAGE_ROOT)).toBe(true);
  });

  it("rejects path traversal attempts", async () => {
    const { resolveSafe, UnsafePathError } = await import("@/server/fs/sandbox");
    expect(() => resolveSafe("../../etc")).toThrow(UnsafePathError);
  });

  it("creates and lists directories", async () => {
    const { createDirectory, listDirectories } = await import("@/server/fs/sandbox");
    createDirectory(".", "My Folder");
    const entries = listDirectories(".");
    expect(entries.some((e) => e.name === "My Folder")).toBe(true);
  });

  it("dedupes base names on collision", async () => {
    const { ensureDir, uniqueBaseName } = await import("@/server/fs/sandbox");
    const { writeFileSync } = await import("node:fs");
    const dir = ensureDir("uniq-test");
    writeFileSync(path.join(dir, "video.mp4"), "x");
    const name = uniqueBaseName(dir, "video");
    expect(name).toBe("video (1)");
  });
});
