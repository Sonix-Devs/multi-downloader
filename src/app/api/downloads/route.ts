import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { downloadManager } from "@/server/downloads/manager";
import { toDownloadItem } from "@/server/downloads/mapper";
import type { StartDownloadPayload } from "@/types/download";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(downloads).orderBy(desc(downloads.createdAt)).limit(200);
  return NextResponse.json({ downloads: rows.map(toDownloadItem) });
}

function isValidPayload(body: unknown): body is StartDownloadPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return typeof b.url === "string" && typeof b.platform === "string" && typeof b.audioOnly === "boolean";
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Missing required download fields." }, { status: 400 });
  }

  const [row] = await db
    .insert(downloads)
    .values({
      url: body.url,
      platform: body.platform,
      title: body.title ?? null,
      creator: body.creator ?? null,
      thumbnailUrl: body.thumbnailUrl ?? null,
      durationSeconds: body.durationSeconds ?? null,
      viewCount: body.viewCount ?? null,
      formatId: body.formatId ?? null,
      qualityLabel: body.qualityLabel ?? null,
      audioOnly: body.audioOnly,
      audioFormat: body.audioFormat ?? "none",
      audioBitrateKbps: body.audioBitrateKbps ?? null,
      saveDir: "",
      status: "queued",
      attempts: 1,
    })
    .returning();

  await downloadManager.enqueue(row.id, body);

  return NextResponse.json({ download: toDownloadItem(row) }, { status: 201 });
}
