import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { downloadManager } from "@/server/downloads/manager";
import { toDownloadItem } from "@/server/downloads/mapper";
import type { DownloadProgressEvent } from "@/types/download";

export const dynamic = "force-dynamic";

const TERMINAL_STATUSES = new Set(["completed", "failed", "canceled"]);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const encoder = new TextEncoder();

  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let listener: ((event: DownloadProgressEvent) => void) | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const rows = await db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
      if (rows.length === 0) {
        send("error", { message: "Not found." });
        controller.close();
        return;
      }

      send("snapshot", toDownloadItem(rows[0]));

      if (TERMINAL_STATUSES.has(rows[0].status)) {
        controller.close();
        return;
      }

      listener = (event: DownloadProgressEvent) => {
        send("progress", event);
        if (TERMINAL_STATUSES.has(event.status)) {
          cleanup();
          controller.close();
        }
      };

      downloadManager.on(`progress:${id}`, listener);

      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      function cleanup() {
        if (listener) downloadManager.off(`progress:${id}`, listener);
        if (heartbeat) clearInterval(heartbeat);
      }

      request.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      if (listener) downloadManager.off(`progress:${id}`, listener);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
