import { describe, expect, it } from "vitest";
import { buildDownloadArgs, parseProgressPayload } from "@/server/ytdlp/args";
import type { StartDownloadPayload } from "@/types/download";

const basePayload: StartDownloadPayload = {
  url: "https://youtube.com/watch?v=abc123",
  platform: "youtube",
  audioOnly: false,
  audioFormat: "none",
  saveDir: ".",
};

describe("buildDownloadArgs", () => {
  it("builds a video download command with the chosen format selector", () => {
    const args = buildDownloadArgs(
      { ...basePayload, formatId: "bestvideo[height<=1080]+bestaudio/best[height<=1080]" },
      "/tmp/out.%(ext)s",
    );
    expect(args).toContain("-f");
    expect(args).toContain("bestvideo[height<=1080]+bestaudio/best[height<=1080]");
    expect(args).toContain("--merge-output-format");
    expect(args).toContain("mp4");
    expect(args[args.length - 1]).toBe(basePayload.url);
  });

  it("falls back to a sane default selector when none is provided", () => {
    const args = buildDownloadArgs(basePayload, "/tmp/out.%(ext)s");
    expect(args).toContain("bestvideo+bestaudio/best");
  });

  it("builds an audio-only extraction command with bitrate", () => {
    const args = buildDownloadArgs(
      { ...basePayload, audioOnly: true, audioFormat: "mp3", audioBitrateKbps: 192 },
      "/tmp/out.%(ext)s",
    );
    expect(args).toContain("-x");
    expect(args).toContain("--audio-format");
    expect(args).toContain("mp3");
    expect(args).toContain("--audio-quality");
    expect(args).toContain("192K");
  });

  it("omits --audio-quality for lossless WAV", () => {
    const args = buildDownloadArgs(
      { ...basePayload, audioOnly: true, audioFormat: "wav", audioBitrateKbps: 320 },
      "/tmp/out.%(ext)s",
    );
    expect(args).not.toContain("--audio-quality");
  });

  it("includes progress templates for machine-readable parsing", () => {
    const args = buildDownloadArgs(basePayload, "/tmp/out.%(ext)s");
    expect(args.some((a) => a.includes("@MDL-PROGRESS@"))).toBe(true);
    expect(args.some((a) => a.includes("@MDL-POSTPROCESS@"))).toBe(true);
  });
});

describe("parseProgressPayload", () => {
  it("computes percentage from downloaded/total bytes", () => {
    const result = parseProgressPayload(JSON.stringify({ downloaded_bytes: 50, total_bytes: 200, speed: 1000, eta: 10 }), "downloading");
    expect(result?.percent).toBe(25);
    expect(result?.speedBytesPerSec).toBe(1000);
    expect(result?.etaSeconds).toBe(10);
  });

  it("falls back to total_bytes_estimate when total_bytes is missing", () => {
    const result = parseProgressPayload(JSON.stringify({ downloaded_bytes: 10, total_bytes_estimate: 100 }), "downloading");
    expect(result?.percent).toBe(10);
  });

  it("treats processing phase with no totals as 100%", () => {
    const result = parseProgressPayload(JSON.stringify({}), "processing");
    expect(result?.percent).toBe(100);
  });

  it("returns null for malformed JSON", () => {
    expect(parseProgressPayload("{not json", "downloading")).toBeNull();
  });
});
