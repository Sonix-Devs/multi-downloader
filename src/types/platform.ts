/**
 * Canonical platform identifiers. Must stay aligned with the `platformEnum`
 * defined in `src/db/schema.ts`.
 */
export type PlatformId =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "twitter"
  | "facebook"
  | "reddit"
  | "twitch"
  | "vimeo"
  | "soundcloud"
  | "pinterest"
  | "generic";

export type ContentKind =
  | "video"
  | "shorts"
  | "playlist"
  | "reel"
  | "post"
  | "story"
  | "igtv"
  | "clip"
  | "track"
  | "pin"
  | "unknown";

export interface PlatformMatch {
  platform: PlatformId;
  kind: ContentKind;
  /** Original URL, trimmed. */
  url: string;
}

export interface PlatformDefinition {
  id: PlatformId;
  label: string;
  /** Tailwind-friendly hex used for badges, glows and accents. */
  color: string;
  /** Subtle tint used for badge backgrounds. */
  tint: string;
  patterns: { regex: RegExp; kind: ContentKind }[];
}
