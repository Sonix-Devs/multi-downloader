import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { downloads } from "@/db/schema";
import { resolveYtDlp, ffmpegDir } from "@/server/bin/resolve";
import { ensureDir, findProducedFiles, fileSizeSafe, uniqueBaseName } from "@/server/fs/sandbox";
import { sanitizeFileName } from "@/lib/format";
import { buildDownloadArgs, parseProgressPayload, PROGRESS_MARKER, POSTPROCESS_MARKER } from "@/server/ytdlp/args";
import type { DownloadProgressEvent, DownloadStatus, StartDownloadPayload } from "@/types/download";

const DB_WRITE_THROTTLE_MS = 900;

interface ActiveJob {
  id: string;
  child: ChildProcessWithoutNullStreams | null;
  canceled: boolean;
  lastDbWrite: number;
  stderrTail: string[];
  saveDirAbs: string;
  baseName: string;
}

/**
 * Central orchestrator for every yt-dlp invocation. Runs as a module-level
 * singleton (survives across requests within the same Node process, which
 * is how `next start` behaves) so a single in-memory queue + child process
 * table can safely coordinate concurrency and cancellation.
 */
class DownloadManager extends EventEmitter {
  private jobs = new Map<string, ActiveJob>();

  private pendingQueue: string[] = [];

  private concurrencyLimit = 3;

  setConcurrencyLimit(limit: number): void {
    this.concurrencyLimit = Math.max(1, limit);
    this.pump();
  }

  private get activeCount(): number {
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.child) count += 1;
    }
    return count;
  }

  emitProgress(event: DownloadProgressEvent): void {
    this.emit(`progress:${event.id}`, event);
    this.emit("progress", event);
  }

  async enqueue(id: string, payload: StartDownloadPayload): Promise<void> {
    this.pendingQueue.push(id);
    this.pendingPayloads.set(id, payload);
    this.pump();
  }

  private pendingPayloads = new Map<string, StartDownloadPayload>();

  private pump(): void {
    while (this.activeCount < this.concurrencyLimit && this.pendingQueue.length > 0) {
      const id = this.pendingQueue.shift();
      if (!id) break;
      const payload = this.pendingPayloads.get(id);
      this.pendingPayloads.delete(id);
      if (payload) {
        void this.runJob(id, payload);
      }
    }
  }

  private async persist(id: string, patch: Partial<typeof downloads.$inferInsert>): Promise<void> {
    await db
      .update(downloads)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(downloads.id, id));
  }

  private async runJob(id: string, payload: StartDownloadPayload): Promise<void> {
    const { path: ytDlpPath, error: ytDlpError } = resolveYtDlp();
    if (!ytDlpPath) {
      await this.fail(id, ytDlpError ?? "yt-dlp is not installed on this server.", "");
      return;
    }

    const saveDirAbs = ensureDir(id);
    const desiredBase = sanitizeFileName(payload.title || "download");
    const baseName = uniqueBaseName(saveDirAbs, desiredBase);

    const job: ActiveJob = {
      id,
      child: null,
      canceled: false,
      lastDbWrite: 0,
      stderrTail: [],
      saveDirAbs,
      baseName,
    };
    this.jobs.set(id, job);

    await this.persist(id, { status: "downloading", fileName: null, filePath: null, progressPercent: 0 });
    this.emitProgress({ id, status: "downloading", progressPercent: 0, speedBytesPerSec: null, etaSeconds: null, totalBytes: null, downloadedBytes: 0 });

    const outputTemplate = path.join(saveDirAbs, `${baseName}.%(ext)s`);
    const args = buildDownloadArgs(payload, outputTemplate);

    const fdir = ffmpegDir();
    if (fdir) {
      args.push("--ffmpeg-location", fdir);
    }

    const child = spawn(ytDlpPath, args, { windowsHide: true });
    job.child = child;

    let stdoutBuffer = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdoutBuffer += chunk;
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? "";
      for (const line of lines) {
        this.handleLine(id, job, line);
      }
    });

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      const lines = chunk.split(/\r?\n/).filter(Boolean);
      job.stderrTail.push(...lines);
      if (job.stderrTail.length > 60) {
        job.stderrTail.splice(0, job.stderrTail.length - 60);
      }
    });

    child.on("error", (err) => {
      void this.fail(id, `Failed to launch yt-dlp: ${err.message}`, job.stderrTail.join("\n"));
      this.jobs.delete(id);
      this.pump();
    });

    child.on("close", (code) => {
      void this.handleExit(id, job, code);
    });
  }

  private handleLine(id: string, job: ActiveJob, line: string): void {
    if (line.startsWith(PROGRESS_MARKER)) {
      this.handleProgressLine(id, job, line.slice(PROGRESS_MARKER.length), "downloading");
      return;
    }
    if (line.startsWith(POSTPROCESS_MARKER)) {
      this.handleProgressLine(id, job, line.slice(POSTPROCESS_MARKER.length), "processing");
      return;
    }
  }

  private handleProgressLine(id: string, job: ActiveJob, jsonText: string, phase: DownloadStatus): void {
    if (phase !== "downloading" && phase !== "processing") return;
    const parsed = parseProgressPayload(jsonText, phase);
    if (!parsed) return;

    const event: DownloadProgressEvent = {
      id,
      status: phase,
      progressPercent: parsed.percent,
      speedBytesPerSec: parsed.speedBytesPerSec,
      etaSeconds: parsed.etaSeconds,
      totalBytes: parsed.totalBytes,
      downloadedBytes: parsed.downloadedBytes,
    };
    this.emitProgress(event);

    const now = Date.now();
    if (now - job.lastDbWrite > DB_WRITE_THROTTLE_MS) {
      job.lastDbWrite = now;
      void this.persist(id, {
        status: phase,
        progressPercent: parsed.percent,
        speedBytesPerSec: parsed.speedBytesPerSec,
        etaSeconds: parsed.etaSeconds,
        totalBytes: parsed.totalBytes,
        downloadedBytes: parsed.downloadedBytes,
      });
    }
  }

  private async handleExit(id: string, job: ActiveJob, code: number | null): Promise<void> {
    this.jobs.delete(id);

    if (job.canceled) {
      await this.persist(id, { status: "canceled" });
      this.emitProgress({ id, status: "canceled", progressPercent: 0, speedBytesPerSec: null, etaSeconds: null, totalBytes: null, downloadedBytes: 0 });
      this.pump();
      return;
    }

    if (code !== 0) {
      const log = job.stderrTail.join("\n");
      const errorLine = job.stderrTail.slice().reverse().find((l) => l.trim().startsWith("ERROR:"));
      await this.fail(id, errorLine ? errorLine.replace(/^ERROR:\s*/, "") : `yt-dlp exited with code ${code}.`, log);
      this.pump();
      return;
    }

    const produced = findProducedFiles(job.saveDirAbs, job.baseName);
    if (produced.length === 0) {
      await this.fail(id, "Download finished but the output file could not be located.", job.stderrTail.join("\n"));
      this.pump();
      return;
    }

    const filePath = produced[0];
    const fileName = path.basename(filePath);
    const fileSizeBytes = fileSizeSafe(filePath);
    const completedAt = new Date();

    await this.persist(id, {
      status: "completed",
      progressPercent: 100,
      fileName,
      filePath,
      fileSizeBytes,
      completedAt,
    });
    this.emitProgress({
      id,
      status: "completed",
      progressPercent: 100,
      speedBytesPerSec: null,
      etaSeconds: 0,
      totalBytes: fileSizeBytes,
      downloadedBytes: fileSizeBytes ?? 0,
      fileName,
      filePath,
      fileSizeBytes,
      completedAt: completedAt.toISOString(),
    });
    this.pump();
  }

  private async fail(id: string, message: string, log: string): Promise<void> {
    await this.persist(id, { status: "failed", errorMessage: message, errorLog: log });
    this.emitProgress({
      id,
      status: "failed",
      progressPercent: 0,
      speedBytesPerSec: null,
      etaSeconds: null,
      totalBytes: null,
      downloadedBytes: 0,
      errorMessage: message,
      errorLog: log,
    });
  }

  cancel(id: string): boolean {
    const job = this.jobs.get(id);
    if (job?.child) {
      job.canceled = true;
      job.child.kill("SIGTERM");
      setTimeout(() => {
        if (job.child && !job.child.killed) job.child.kill("SIGKILL");
      }, 2500);
      return true;
    }
    const queuedIndex = this.pendingQueue.indexOf(id);
    if (queuedIndex >= 0) {
      this.pendingQueue.splice(queuedIndex, 1);
      this.pendingPayloads.delete(id);
      void this.persist(id, { status: "canceled" });
      this.emitProgress({ id, status: "canceled", progressPercent: 0, speedBytesPerSec: null, etaSeconds: null, totalBytes: null, downloadedBytes: 0 });
      return true;
    }
    return false;
  }

  isActive(id: string): boolean {
    return this.jobs.has(id) || this.pendingQueue.includes(id);
  }
}

const globalForManager = globalThis as typeof globalThis & { __multiDownloaderManager?: DownloadManager };

export const downloadManager = globalForManager.__multiDownloaderManager ?? new DownloadManager();
globalForManager.__multiDownloaderManager = downloadManager;
