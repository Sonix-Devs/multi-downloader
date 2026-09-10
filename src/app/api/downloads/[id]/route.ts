import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { unlink } from "node:fs/promises";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { toDownloadItem } from "@/server/downloads/mapper";
import { downloadManager } from "@/server/downloads/manager";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ download: toDownloadItem(rows[0]) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const removeFile = request.nextUrl.searchParams.get("removeFile") === "true";

  if (downloadManager.isActive(id)) {
    downloadManager.cancel(id);
  }

  const rows = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
  if (rows.length > 0 && removeFile && rows[0].filePath) {
    try {
      await unlink(rows[0].filePath);
    } catch {
      // File may already be gone; ignore.
    }
  }

  await db.delete(downloads).where(eq(downloads.id, id));
  return NextResponse.json({ ok: true });
}
