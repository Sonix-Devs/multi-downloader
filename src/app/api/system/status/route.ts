import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { getBinaryStatus, resolveYtDlp, resetBinaryCache } from "@/server/bin/resolve";
import { STORAGE_ROOT } from "@/server/fs/sandbox";

export const dynamic = "force-dynamic";

export async function GET() {
  const ytDlp = getBinaryStatus("yt-dlp");
  const ffmpeg = getBinaryStatus("ffmpeg");
  return NextResponse.json({ ytDlp, ffmpeg, storageRoot: STORAGE_ROOT });
}

/** Triggers `yt-dlp -U` to self-update the extraction backend (checksum-verified by yt-dlp itself). */
export async function POST() {
  const { path: bin } = resolveYtDlp();
  if (!bin) {
    return NextResponse.json({ error: "yt-dlp is not installed." }, { status: 503 });
  }

  return new Promise<NextResponse>((resolve) => {
    execFile(bin, ["-U"], { timeout: 30000 }, (err, stdout, stderr) => {
      resetBinaryCache();
      if (err) {
        resolve(NextResponse.json({ ok: false, message: stderr || err.message }, { status: 500 }));
        return;
      }
      resolve(NextResponse.json({ ok: true, message: stdout.trim() }));
    });
  });
}
