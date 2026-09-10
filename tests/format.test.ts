import { describe, expect, it } from "vitest";
import { clamp, formatBytes, formatDuration, formatEta, formatSpeed, sanitizeFileName } from "@/lib/format";

describe("formatBytes", () => {
  it("formats bytes into human readable units", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024 * 1.5)).toBe("1.5 MB");
  });

  it("handles null/undefined gracefully", () => {
    expect(formatBytes(null)).toBe("—");
    expect(formatBytes(undefined)).toBe("—");
  });
});

describe("formatSpeed", () => {
  it("appends /s to a byte rate", () => {
    expect(formatSpeed(1024 * 1024)).toBe("1.0 MB/s");
  });
  it("shows a dash when unknown", () => {
    expect(formatSpeed(null)).toBe("—");
    expect(formatSpeed(0)).toBe("—");
  });
});

describe("formatDuration", () => {
  it("formats seconds as mm:ss under an hour", () => {
    expect(formatDuration(65)).toBe("1:05");
  });
  it("formats seconds as h:mm:ss over an hour", () => {
    expect(formatDuration(3725)).toBe("1:02:05");
  });
  it("handles missing values", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(-1)).toBe("—");
  });
});

describe("formatEta", () => {
  it("formats a friendly ETA string", () => {
    expect(formatEta(5)).toBe("5s");
    expect(formatEta(65)).toBe("1m 5s");
    expect(formatEta(134)).toBe("2m 14s");
    expect(formatEta(3661)).toBe("1h 1m");
  });
  it("handles sub-second and missing values", () => {
    expect(formatEta(0.4)).toBe("< 1s");
    expect(formatEta(null)).toBe("—");
  });
});

describe("sanitizeFileName", () => {
  it("strips unsafe filesystem characters", () => {
    expect(sanitizeFileName('a/b\\c?d%e*f:g|h"i<j>k')).toBe("a-b-c-d-e-f-g-h-i-j-k");
  });
  it("falls back when the result is empty", () => {
    expect(sanitizeFileName("   ", "fallback")).toBe("fallback");
  });
  it("truncates very long names", () => {
    const long = "a".repeat(300);
    expect(sanitizeFileName(long).length).toBeLessThanOrEqual(150);
  });
});

describe("clamp", () => {
  it("clamps within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(50, 0, 10)).toBe(10);
  });
});
