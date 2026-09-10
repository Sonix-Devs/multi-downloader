import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/server/settings/store";
import { downloadManager } from "@/server/downloads/manager";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updated = await updateSettings(body as Record<string, unknown>);
  if (typeof updated.concurrentDownloadLimit === "number") {
    downloadManager.setConcurrencyLimit(updated.concurrentDownloadLimit);
  }
  return NextResponse.json({ settings: updated });
}
