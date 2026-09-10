import { NextRequest, NextResponse } from "next/server";
import { fetchMetadata, MetadataError } from "@/server/ytdlp/metadata";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const url = typeof body === "object" && body !== null && "url" in body ? (body as { url: unknown }).url : null;
  if (typeof url !== "string" || url.trim().length === 0) {
    return NextResponse.json({ error: "A URL is required." }, { status: 400 });
  }

  try {
    const metadata = await fetchMetadata(url);
    return NextResponse.json({ metadata });
  } catch (error) {
    if (error instanceof MetadataError) {
      const status = error.code === "BINARY_MISSING" ? 503 : 422;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
