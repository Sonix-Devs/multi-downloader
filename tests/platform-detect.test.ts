import { describe, expect, it } from "vitest";
import { detectPlatform, detectPlatformOrGeneric, looksLikeUrl } from "@/lib/platform/detect";

describe("looksLikeUrl", () => {
  it("accepts bare domains and full URLs", () => {
    expect(looksLikeUrl("youtube.com/watch?v=abc")).toBe(true);
    expect(looksLikeUrl("https://youtube.com")).toBe(true);
  });

  it("rejects plain text", () => {
    expect(looksLikeUrl("hello world")).toBe(false);
    expect(looksLikeUrl("")).toBe(false);
  });
});

describe("detectPlatform", () => {
  it("detects a standard YouTube video URL", () => {
    const match = detectPlatform("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(match?.platform).toBe("youtube");
    expect(match?.kind).toBe("video");
  });

  it("detects YouTube Shorts", () => {
    const match = detectPlatform("https://youtube.com/shorts/abc123");
    expect(match?.platform).toBe("youtube");
    expect(match?.kind).toBe("shorts");
  });

  it("detects a YouTube playlist without a video id", () => {
    const match = detectPlatform("https://www.youtube.com/playlist?list=PLxyz");
    expect(match?.platform).toBe("youtube");
    expect(match?.kind).toBe("playlist");
  });

  it("detects TikTok video URLs", () => {
    const match = detectPlatform("https://www.tiktok.com/@user/video/1234567890");
    expect(match?.platform).toBe("tiktok");
  });

  it("detects Instagram reels, posts and stories", () => {
    expect(detectPlatform("https://instagram.com/reel/abcXYZ")?.kind).toBe("reel");
    expect(detectPlatform("https://instagram.com/p/abcXYZ")?.kind).toBe("post");
    expect(detectPlatform("https://instagram.com/stories/someone/12345")?.kind).toBe("story");
    expect(detectPlatform("https://instagram.com/tv/abcXYZ")?.kind).toBe("igtv");
  });

  it("detects X/Twitter status links", () => {
    expect(detectPlatform("https://x.com/user/status/12345")?.platform).toBe("twitter");
    expect(detectPlatform("https://twitter.com/user/status/12345")?.platform).toBe("twitter");
  });

  it("detects Facebook, Reddit, Twitch, Vimeo, SoundCloud, Pinterest", () => {
    expect(detectPlatform("https://fb.watch/abcd/")?.platform).toBe("facebook");
    expect(detectPlatform("https://www.reddit.com/r/videos/comments/abc123/title/")?.platform).toBe("reddit");
    expect(detectPlatform("https://clips.twitch.tv/SomeClipName")?.platform).toBe("twitch");
    expect(detectPlatform("https://vimeo.com/12345678")?.platform).toBe("vimeo");
    expect(detectPlatform("https://soundcloud.com/artist/track-name")?.platform).toBe("soundcloud");
    expect(detectPlatform("https://pin.it/abc123")?.platform).toBe("pinterest");
  });

  it("returns null for unsupported or garbage input", () => {
    expect(detectPlatform("not a url at all")).toBeNull();
    expect(detectPlatform("")).toBeNull();
  });

  it("falls back to generic for URL-shaped but unrecognized links", () => {
    const generic = detectPlatformOrGeneric("https://example.com/some/video");
    expect(generic?.platform).toBe("generic");
  });
});
