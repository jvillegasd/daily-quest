# Daily Quest — Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. Once created, go to **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Settings → Database** and copy:
   - Connection string (Transaction mode, port 6543) → `DATABASE_URL`
   - Connection string (Session mode, port 5432) → `DIRECT_URL`

## 2. Enable Google OAuth (optional)

1. In Supabase: **Authentication → Providers → Google**
2. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
3. Add your domain to authorized origins

## 3. Create a Resend Account

1. Sign up at [resend.com](https://resend.com) (free tier: 3000 emails/month)
2. Create an API key → `RESEND_API_KEY`
3. Add and verify your domain → `RESEND_FROM_EMAIL`

## 4. Generate VAPID keys (push notifications)

```bash
npx web-push generate-vapid-keys
```

Copy the output to `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`

## 5. Configure environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

## 6. Run database migrations

```bash
npx prisma migrate dev --name init
```

## 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Coolify

### Prerequisites
- Coolify running on your VPS
- A subdomain pointing to your VPS (e.g. `quests.yourdomain.com`)

### Steps

1. **Push to a Git repo** (GitHub, GitLab, or Gitea)

2. **In Coolify:**
   - New Resource → Application
   - Connect your repo
   - Build pack: **Dockerfile**
   - Port: `3000`

3. **Set environment variables** in Coolify's dashboard (all vars from `.env.example`)

4. **Set your subdomain** in Coolify's domain settings

5. **Deploy** — Coolify builds the Docker image and handles SSL via Traefik

### After first deploy

Run the migration against your production database:
```bash
DATABASE_URL="your-production-db-url" npx prisma migrate deploy
```

---

## Create app icons

You need PWA icons at:
- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512)

Use any RPG sword/shield image. A quick way:
```bash
# If you have ImageMagick:
convert -size 192x192 xc:#c9a84c -draw "text 60,120 '⚔️'" public/icons/icon-192.png
```

Or just place any PNG files there manually.

---

## Cron job for notifications

Daily push/email notifications run as a **Coolify Scheduled Task** that executes the
bundled job directly inside the running app container — no HTTP endpoint, no secret.

In Coolify → the `daily-quest` app → **Scheduled Tasks**, add one:

- **Name:** `daily-notifications`
- **Command:** `node scripts/run-cron.cjs`
- **Container:** the app's running container name (required when more than one container exists)
- **Frequency:** `0 13 * * *` (13:00 UTC daily)

The command is bundled at Docker build time from `scripts/run-cron.ts` (see the Dockerfile).
It calls `runDailyNotifications()` (`lib/jobs/daily-notifications.ts`), the same job used in
development. Push/email delivery requires `VAPID_*` and `RESEND_API_KEY` to be set.
