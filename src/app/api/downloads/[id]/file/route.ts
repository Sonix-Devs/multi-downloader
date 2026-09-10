import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { createReadStream, existsSync, statSync } from "node:fs";
import { Readable } from "node:stream";
import path from "node:path";
import { db } from "@/db";
import { downloads } from "@/db/schema";

export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mkv": "video/x-matroska",
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
  if (rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const row = rows[0];
  if (row.status !== "completed" || !row.filePath || !existsSync(row.filePath)) {
    return NextResponse.json({ error: "File is not available." }, { status: 404 });
  }

  const stat = statSync(row.filePath);
  const ext = path.extname(row.filePath).toLowerCase();
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const nodeStream = createReadStream(row.filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": mime,
      "Content-Length": stat.size.toString(),
      "Content-Disposition": `attachment; filename="${encodeURIComponent(row.fileName ?? path.basename(row.filePath))}"`,
    },
  });
}
