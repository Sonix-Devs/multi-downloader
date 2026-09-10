import type { ContentKind, PlatformDefinition, PlatformId, PlatformMatch } from "@/types/platform";

/**
 * Platform catalogue. Order matters: more specific hosts should be checked
 * before generic fallbacks. Every entry defines one or more regexes mapped
 * to a content "kind" so the UI can show richer copy ("Playlist detected"
 * vs. just "YouTube link").
 */
export const PLATFORMS: PlatformDefinition[] = [
  {
    id: "youtube",
    label: "YouTube",
    color: "#FF3B30",
    tint: "#FF3B301A",
    patterns: [
      { regex: /(?:youtube\.com|youtu\.be).*[?&]list=[a-zA-Z0-9_-]+(?!.*[?&]v=)/i, kind: "playlist" },
      { regex: /youtube\.com\/shorts\/[a-zA-Z0-9_-]+/i, kind: "shorts" },
      { regex: /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)[a-zA-Z0-9_-]+/i, kind: "video" },
      { regex: /(?:m\.)?youtube\.com/i, kind: "unknown" },
    ],
  },
  {
    id: "tiktok",
    label: "TikTok",
    color: "#25F4EE",
    tint: "#25F4EE1A",
    patterns: [
      { regex: /tiktok\.com\/@[\w.-]+\/video\/\d+/i, kind: "video" },
      { regex: /vm\.tiktok\.com\/[\w]+/i, kind: "video" },
      { regex: /tiktok\.com/i, kind: "unknown" },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    tint: "#E1306C1A",
    patterns: [
      { regex: /instagram\.com\/reel[s]?\/[\w-]+/i, kind: "reel" },
      { regex: /instagram\.com\/stories\/[\w.-]+\/\d+/i, kind: "story" },
      { regex: /instagram\.com\/tv\/[\w-]+/i, kind: "igtv" },
      { regex: /instagram\.com\/p\/[\w-]+/i, kind: "post" },
      { regex: /instagram\.com/i, kind: "unknown" },
    ],
  },
  {
    id: "twitter",
    label: "X / Twitter",
    color: "#1D9BF0",
    tint: "#1D9BF01A",
    patterns: [
      { regex: /(?:twitter|x)\.com\/[\w]+\/status\/\d+/i, kind: "post" },
      { regex: /(?:twitter|x)\.com/i, kind: "unknown" },
    ],
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    tint: "#1877F21A",
    patterns: [
      { regex: /fb\.watch\/[\w-]+/i, kind: "video" },
      { regex: /facebook\.com\/.*\/videos\/\d+/i, kind: "video" },
      { regex: /facebook\.com\/reel\/\d+/i, kind: "reel" },
      { regex: /facebook\.com\/watch\/?\?v=\d+/i, kind: "video" },
      { regex: /facebook\.com/i, kind: "unknown" },
    ],
  },
  {
    id: "reddit",
    label: "Reddit",
    color: "#FF4500",
    tint: "#FF45001A",
    patterns: [
      { regex: /reddit\.com\/r\/[\w-]+\/comments\/[\w-]+/i, kind: "post" },
      { regex: /v\.redd\.it\/[\w-]+/i, kind: "video" },
      { regex: /reddit\.com/i, kind: "unknown" },
    ],
  },
  {
    id: "twitch",
    label: "Twitch",
    color: "#9146FF",
    tint: "#9146FF1A",
    patterns: [
      { regex: /clips\.twitch\.tv\/[\w-]+/i, kind: "clip" },
      { regex: /twitch\.tv\/[\w-]+\/clip\/[\w-]+/i, kind: "clip" },
      { regex: /twitch\.tv\/videos\/\d+/i, kind: "video" },
      { regex: /twitch\.tv/i, kind: "unknown" },
    ],
  },
  {
    id: "vimeo",
    label: "Vimeo",
    color: "#1AB7EA",
    tint: "#1AB7EA1A",
    patterns: [
      { regex: /vimeo\.com\/\d+/i, kind: "video" },
      { regex: /vimeo\.com/i, kind: "unknown" },
    ],
  },
  {
    id: "soundcloud",
    label: "SoundCloud",
    color: "#FF5500",
    tint: "#FF55001A",
    patterns: [
      { regex: /soundcloud\.com\/[\w-]+\/[\w-]+/i, kind: "track" },
      { regex: /soundcloud\.com/i, kind: "unknown" },
    ],
  },
  {
    id: "pinterest",
    label: "Pinterest",
    color: "#E60023",
    tint: "#E600231A",
    patterns: [
      { regex: /pinterest\.[\w.]+\/pin\/[\w-]+/i, kind: "pin" },
      { regex: /pin\.it\/[\w-]+/i, kind: "pin" },
      { regex: /pinterest\.[\w.]+/i, kind: "unknown" },
    ],
  },
];

export const PLATFORM_MAP: Record<PlatformId, PlatformDefinition | undefined> = PLATFORMS.reduce(
  (acc, def) => {
    acc[def.id] = def;
    return acc;
  },
  {} as Record<PlatformId, PlatformDefinition | undefined>,
);

const URL_LIKE = /^(?:https?:\/\/)?(?:www\.)?[\w-]+(?:\.[\w-]+)+(?:[/?#][^\s]*)?$/i;

/** Cheap, fast pre-check so we don't run the full regex catalogue on garbage input. */
export function looksLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return URL_LIKE.test(trimmed);
}

function normalize(raw: string): string {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Attempts to detect a supported platform for the given input string.
 * Returns `null` when the input isn't URL-shaped or matches no catalogue
 * entry (a "generic" site yt-dlp might still support, handled upstream).
 */
export function detectPlatform(value: string): PlatformMatch | null {
  if (!looksLikeUrl(value)) return null;
  const url = normalize(value);

  for (const def of PLATFORMS) {
    for (const pattern of def.patterns) {
      if (pattern.regex.test(url)) {
        return { platform: def.id, kind: pattern.kind, url };
      }
    }
  }

  return null;
}

/** Best-effort detection that also accepts arbitrary sites yt-dlp may extract. */
export function detectPlatformOrGeneric(value: string): PlatformMatch | null {
  const match = detectPlatform(value);
  if (match) return match;
  if (!looksLikeUrl(value)) return null;
  return { platform: "generic", kind: "unknown", url: normalize(value) };
}

export function getPlatformDefinition(id: PlatformId): PlatformDefinition {
  return (
    PLATFORM_MAP[id] ?? {
      id: "generic",
      label: "Web link",
      color: "#8E8EA0",
      tint: "#8E8EA01A",
      patterns: [],
    }
  );
}

export function kindLabel(kind: ContentKind): string {
  switch (kind) {
    case "video":
      return "Video";
    case "shorts":
      return "Shorts";
    case "playlist":
      return "Playlist";
    case "reel":
      return "Reel";
    case "post":
      return "Post";
    case "story":
      return "Story";
    case "igtv":
      return "IGTV";
    case "clip":
      return "Clip";
    case "track":
      return "Track";
    case "pin":
      return "Pin";
    default:
      return "Link";
  }
}
