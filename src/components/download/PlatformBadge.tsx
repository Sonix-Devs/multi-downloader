"use client";

import { motion } from "framer-motion";
import type { PlatformId } from "@/types/platform";
import { getPlatformDefinition } from "@/lib/platform/detect";
import { Link2 } from "lucide-react";

const MONOGRAMS: Record<PlatformId, string> = {
  youtube: "YT",
  tiktok: "TT",
  instagram: "IG",
  twitter: "X",
  facebook: "FB",
  reddit: "RD",
  twitch: "TV",
  vimeo: "VM",
  soundcloud: "SC",
  pinterest: "PN",
  generic: "",
};

export function PlatformBadge({ platform, size = "md" }: { platform: PlatformId; size?: "sm" | "md" | "lg" }) {
  const def = getPlatformDefinition(platform);
  const dims = size === "sm" ? 24 : size === "lg" ? 44 : 32;
  const fontSize = size === "sm" ? 9 : size === "lg" ? 14 : 11;
  const monogram = MONOGRAMS[platform];

  return (
    <motion.div
      key={platform}
      initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      style={{ width: dims, height: dims, background: def.tint, color: def.color }}
      className="flex shrink-0 items-center justify-center rounded-full font-bold"
      title={def.label}
    >
      {monogram ? <span style={{ fontSize }}>{monogram}</span> : <Link2 size={fontSize + 4} />}
    </motion.div>
  );
}
