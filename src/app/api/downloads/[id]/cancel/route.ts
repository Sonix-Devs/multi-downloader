import { NextRequest, NextResponse } from "next/server";
import { downloadManager } from "@/server/downloads/manager";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const canceled = downloadManager.cancel(id);
  if (!canceled) {
    return NextResponse.json({ error: "This download is not active." }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
