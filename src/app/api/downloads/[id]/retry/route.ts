import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { downloadManager } from "@/server/downloads/manager";
import { toDownloadItem } from "@/server/downloads/mapper";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const row = rows[0];

  if (downloadManager.isActive(id)) {
    return NextResponse.json({ error: "This download is already running." }, { status: 409 });
  }

  const [updated] = await db
    .update(downloads)
    .set({
      status: "queued",
      progressPercent: 0,
      speedBytesPerSec: null,
      etaSeconds: null,
      downloadedBytes: 0,
      errorMessage: null,
      errorLog: null,
      attempts: sql`${downloads.attempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(downloads.id, id))
    .returning();

  await downloadManager.enqueue(id, {
    url: row.url,
    platform: row.platform,
    title: row.title,
    creator: row.creator,
    thumbnailUrl: row.thumbnailUrl,
    durationSeconds: row.durationSeconds,
    viewCount: row.viewCount,
    formatId: row.formatId,
    qualityLabel: row.qualityLabel,
    audioOnly: row.audioOnly,
    audioFormat: row.audioFormat,
    audioBitrateKbps: row.audioBitrateKbps,
  });

  return NextResponse.json({ download: toDownloadItem(updated) });
}
