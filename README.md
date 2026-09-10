# Multi Downloader

A premium, professional media-download web application for YouTube, TikTok,
Instagram, X/Twitter, Facebook, Reddit, Twitch, Vimeo, SoundCloud, and
Pinterest — built with Next.js (App Router), TypeScript, TailwindCSS, Framer
Motion, Zustand, PostgreSQL/Drizzle ORM, and a `yt-dlp` + `ffmpeg` backend.

> **Platform note:** this project runs as a Next.js fullstack web app (server
> + browser UI) rather than a native Electron desktop shell, so it can be
> deployed anywhere Node.js runs. Every capability from the original desktop
> brief — real-time link detection, live metadata preview, quality/format
> selection, a concurrent download queue with true progress streaming,
> history, and rich settings — is implemented end-to-end; only OS-native
> chrome (a literal frameless window, a native folder-picker dialog, and
> installer packaging) is adapted to safe, equivalent web patterns (an
> in-app sandboxed folder browser, browser file downloads, and a desktop-app
> inspired UI shell).

## Feature highlights

- **Real-time platform detection** — regex-based recognition for 10
  platforms & their content types (YouTube video/Shorts/playlist, Instagram
  Reels/Posts/Stories/IGTV, Twitch clips, etc.) with a 300ms debounced
  metadata fetch and an animated platform badge.
- **Clipboard auto-detect** — offers a one-click "Paste from clipboard?"
  suggestion when a supported link is already copied.
- **Rich content preview** — thumbnail, title, creator, duration, and view
  count, with shimmering skeleton loading and graceful error states for
  private/age-restricted/unsupported content.
- **Dynamic quality selection** — resolutions are read live from `yt-dlp`
  per link (never hardcoded), plus a dedicated audio-only mode with
  MP3/M4A/WAV and selectable bitrate, with estimated file sizes.
- **Sandboxed folder picker** — an in-app folder browser (create/browse
  nested folders) standing in for a native OS dialog, with a default save
  path stored in Settings and a per-download "remember this choice" toggle.
- **Live download queue** — concurrent downloads (configurable limit), each
  with independent state (queued → downloading → processing → completed /
  failed / canceled), animated progress bar, live speed/ETA/size stats
  streamed over Server-Sent Events, and clean cancellation that kills the
  underlying process and removes partial files.
- **History** — searchable, filterable list of every past download with
  quick actions (open file, copy path, retry, remove).
- **Settings** — defaults for quality/format/bitrate/save folder, theme
  (light/dark/system), concurrency limit, notifications, clipboard
  auto-detect, and a live engine status panel (yt-dlp/ffmpeg version +
  "check for updates").
- **Legal** — in-app Privacy/Terms/Cookies pages plus root `PRIVACY.md`,
  `TERMS.md`, `COOKIES.md`, and `LICENSE`.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router), React 19, TypeScript strict |
| Styling | TailwindCSS v4 with a bespoke design-token system |
| Motion | Framer Motion (spring transitions, shared layout animations) |
| State | Zustand (`downloadsStore`, `settingsStore`, `uiStore`) |
| Database | PostgreSQL via Drizzle ORM |
| Extraction engine | `yt-dlp` (spawned as a child process) |
| Media processing | `ffmpeg` (stream merge / audio extraction) |
| Realtime updates | Server-Sent Events (`/api/downloads/[id]/events`) |
| Tests | Vitest (unit tests for platform detection, formatting, CLI arg
building, and sandboxed filesystem safety) |

## Project layout

```
src/
  app/                    Next.js routes (pages + API route handlers)
    api/                  metadata, downloads, settings, fs, system endpoints
    history/ settings/ legal/   feature pages
  components/
    ui/                    atomic design-system primitives
    download/              link input, preview, quality picker, queue, cards
    layout/                app shell, sidebar, top bar, bootstrap
    settings/ legal/        feature-specific panels
  server/
    ytdlp/                 metadata fetch + CLI argument builder (pure, tested)
    downloads/              in-process download manager (queueing, progress)
    fs/                     sandboxed folder browser
    bin/                    yt-dlp / ffmpeg binary resolution
    settings/                settings persistence
  store/                    Zustand stores
  hooks/                     debouncing, clipboard suggestion
  lib/                       platform detection, formatting, utilities
  types/                     shared TypeScript contracts
  db/                        Drizzle schema + client
tests/                        Vitest unit tests
```

## Requirements on the host

- Node.js 20+
- PostgreSQL (connection string in `.env` as `DATABASE_URL`)
- `yt-dlp` on `PATH` (or set `YTDLP_PATH` to its absolute path)
- `ffmpeg` on `PATH` (or set `FFMPEG_PATH` to its absolute path)

If either binary is missing, the app degrades gracefully: the Settings page
shows a clear "Not found" status, and metadata/download requests return a
friendly error instead of crashing.

## Development

```bash
npm install
npx drizzle-kit push   # sync the schema to your database
npm run dev
```

## Testing

```bash
npx vitest run
```

## Building

```bash
npx next typegen
npm run build
npm run start
```

## Deployment

This app needs a real, persistent Node.js host (it spawns `yt-dlp`/`ffmpeg`
processes and keeps in-memory job state) — it cannot run on Cloudflare
Pages or Workers. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for ready-to-use
Fly.io/Railway/Docker setups, and for how to correctly put Cloudflare in
front of your deployment as a CDN/proxy.

