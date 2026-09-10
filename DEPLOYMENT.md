# Deployment Guide

## Read this first: why Cloudflare Pages/Workers cannot run this app

This application is **not** deployable to Cloudflare Pages or Cloudflare
Workers as its hosting platform. This is a hard technical limitation, not
a configuration problem:

- The app spawns real `yt-dlp` and `ffmpeg` **child processes** on the
  server for every download. Cloudflare Workers run on the V8 isolate
  runtime, not Node.js, and cannot spawn OS processes or execute external
  binaries at all.
- The app writes downloaded files to a **persistent filesystem** while a
  download is in progress. Cloudflare Workers have no filesystem.
- The app keeps an **in-memory job queue and event emitter** (`downloadManager`)
  that lives across requests within one Node process, and streams live
  progress over Server-Sent Events. Cloudflare Workers are stateless,
  request-scoped isolates — there is no persistent process to hold that
  state or push events from.
- The app uses a normal **PostgreSQL connection pool** (`pg` +
  `node-postgres`), which needs a long-lived TCP connection — not
  supported inside a Worker.

None of this is fixable by adjusting `wrangler.toml` or picking a
different Cloudflare product; it would require rewriting the download
engine itself to run somewhere else and rewriting the frontend to talk to
that remote engine.

## What "deploy via Cloudflare" realistically means here

The correct and very common pattern for an app like this is:

1. **Run the actual application** (this Next.js app, with `yt-dlp` and
   `ffmpeg`, and Postgres) on a normal, persistent Node host — see
   options below.
2. **Put Cloudflare in front of it as a reverse proxy / CDN**, by pointing
   your domain's DNS at that host through Cloudflare with the orange
   "Proxied" cloud icon enabled. This gives you Cloudflare's SSL, DDoS
   protection, and caching for static assets — which is what most people
   mean in practice by "hosting a self-hosted app through Cloudflare."

This repository is set up for step 1. Step 2 is a few clicks in the
Cloudflare dashboard once you have a real host running (see "Fronting
with Cloudflare" below).

## Option A: Fly.io (recommended, matches the included config)

This repo includes `Dockerfile`, `fly.toml`, and
`.github/workflows/deploy.yml`, wired for Fly.io, which supports Docker
deploys, persistent volumes (for the downloads staging directory), and
GitHub-triggered deploys.

1. Install `flyctl` and run `fly auth login`.
2. From the repo root: `fly launch --no-deploy` (it will detect the
   existing `fly.toml` — say yes to using it, and create a Postgres
   database when prompted, or attach one separately with
   `fly postgres create` + `fly postgres attach`).
3. `fly volumes create multi_downloader_data --size 5` (matches the mount
   in `fly.toml`).
4. Set the database connection string: `fly secrets set DATABASE_URL=...`
5. Run the database migration: `fly ssh console -C "node_modules/.bin/drizzle-kit push"`
   (or run migrations locally against the Fly Postgres connection string
   before first deploy).
6. Push to `main` — the included `deploy.yml` workflow runs
   `flyctl deploy` automatically. You'll need to add a `FLY_API_TOKEN`
   repository secret in GitHub (Settings → Secrets and variables →
   Actions), generated via `fly tokens create deploy`.

## Option B: Railway / Render (simplest, no CLI required)

Both platforms can build directly from the included `Dockerfile` and
connect to GitHub for automatic redeploys on push:

1. Create a new project from your GitHub repo.
2. Add a Postgres database from the platform's marketplace/add-ons —
   both platforms set `DATABASE_URL` automatically.
3. Set `MULTI_DOWNLOADER_ROOT=/data/downloads` and attach a persistent
   volume/disk at `/data` in the platform's settings (both Railway and
   Render support persistent volumes on their paid tiers; the free tiers
   generally do not, which matters here since downloads are staged to
   disk).
4. Deploy. Redeploys on every push to `main` happen automatically once
   connected.

## Option C: Any VPS with Docker

`docker-compose.yml` is included for exactly this: a droplet, EC2
instance, or similar.

```bash
git clone <your-fork-url>
cd multi-downloader
docker compose up -d --build
```

Run the schema migration once against the compose Postgres instance
(`docker compose exec app node_modules/.bin/drizzle-kit push`, or run it
locally pointed at the exposed `5432` port).

## Option D: Cloudflare Containers (real Cloudflare hosting, not Pages/Workers alone)

Cloudflare's newer **Containers** product runs real Docker images (unlike
plain Workers/Pages), so it genuinely can run this app — `yt-dlp`,
`ffmpeg`, and the persistent Node process — with these differences from a
normal VPS:

- Requires a **Workers Paid plan** ($5/month minimum).
- Every request is routed through a thin Worker (`worker/index.ts`) to a
  single container instance (`wrangler.jsonc` pins it to one instance via
  `max_instances: 1` and a fixed instance name, since this app keeps
  in-memory job state and SSE connections that must stay on one process).
- Disk is limited by the chosen `instance_type` (check current sizes in
  the Cloudflare dashboard — verify this covers your typical download
  sizes before relying on it for very large files).
- **Cloudflare does not offer a managed Postgres product.** You still
  need an external Postgres database — the simplest option is a free
  [Neon](https://neon.tech) or [Supabase](https://supabase.com) instance,
  both give you a `DATABASE_URL` connection string that works as-is.
- The container can go to sleep after inactivity (`sleepAfter: "10m"` in
  `worker/index.ts`) to save cost, meaning the first request after a
  quiet period will be slightly slower while it cold-starts — this is a
  real tradeoff of this platform, not a bug.

### Setup

1. Create a free Postgres database (e.g. at neon.tech) and copy its
   connection string.
2. Install Wrangler and log in: `npm install`, then `npx wrangler login`.
3. Set the database secret: `npx wrangler secret put DATABASE_URL`
   (paste the connection string when prompted).
4. Run the schema migration once, pointed at that same database:
   `DATABASE_URL="..." npx drizzle-kit push`
5. Deploy: `npx wrangler deploy`

Your app will be live at `https://multi-downloader.<your-subdomain>.workers.dev`,
and you can attach your own domain to it from the Cloudflare dashboard
(Workers & Pages → your Worker → Settings → Domains & Routes) — this
replaces the separate "front it with Cloudflare DNS" step described
above, since in this option Cloudflare already **is** the host.

### Automatic deploys from GitHub

`.github/workflows/deploy-cloudflare.yml` is included and runs
`wrangler deploy` on every push to `main`. Add a repository secret named
`CLOUDFLARE_API_TOKEN` (GitHub repo → Settings → Secrets and variables →
Actions) — create the token at
https://dash.cloudflare.com/profile/api-tokens using the "Edit Cloudflare
Workers" template.

Note that this is a fast-evolving Cloudflare product; if `wrangler deploy`
reports a config error, check the exact current field names for
`instance_type` and container limits against
https://developers.cloudflare.com/containers/ before assuming the rest
of this setup is wrong.

## Fronting Options A–C with Cloudflare (DNS/CDN proxy, not hosting)

If you went with Fly.io, Railway/Render, or a VPS (Options A–C) instead of
Cloudflare Containers, once your app is live at some origin (a Fly.io
`.fly.dev` URL, your Railway/Render URL, or your VPS's IP):

1. Add your domain to Cloudflare and point its nameservers at Cloudflare.
2. Create a DNS record (A or CNAME) pointing at your origin, with the
   orange "Proxied" cloud enabled.
3. Under SSL/TLS, set the mode to "Full" or "Full (strict)" so traffic
   between Cloudflare and your origin is also encrypted.

That's it — your custom domain now serves through Cloudflare's edge,
while the actual `yt-dlp`/`ffmpeg` engine keeps running on a real Node
host behind it.

## Environment variables reference

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `MULTI_DOWNLOADER_ROOT` | No (defaults to `./storage/downloads`) | Absolute path where in-progress and completed downloads are staged before being streamed to the browser |
| `PORT` | No (defaults to `3000`) | Port the Node server listens on |
