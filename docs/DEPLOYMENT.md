# Deployment checklist — Paycheck Planner

## Vercel (frontend)

1. Connect the GitHub repo and set **Framework Preset** to Next.js.
2. Set **Root Directory** if the app is not at repo root.
3. Configure environment variables (see below).
4. Enable **Production** deploys from `main` (or your release branch).
5. Optional: add `NEXT_PUBLIC_APP_VERSION` from `src/lib/version.ts` on each release.

### Recommended Vercel settings

- Node.js 20+
- `npm run build` / default output
- Enable Web Analytics in Vercel dashboard (complements PostHog)

## Supabase

1. Create project; run migrations if using SQL schema.
2. Enable **Row Level Security** on all user tables.
3. Policies: users read/write only their own `profiles`, `transactions`, `receipts` rows (`auth.uid() = user_id`).
4. Create Storage bucket `receipts` (private); policy: authenticated upload/read own paths.
5. Copy **Project URL** and **anon key** to Vercel env.
6. Service role key: **server-only**, never `NEXT_PUBLIC_*`.

### RLS audit checklist

- [ ] `transactions` — SELECT/INSERT/UPDATE/DELETE scoped to owner
- [ ] `accounts`, `categories`, `goals` — same
- [ ] `household_members` — members of household only
- [ ] Storage `receipts/{userId}/*` — owner only
- [ ] No policy grants `true` for `anon` on sensitive tables

## Environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | Yes | Production URL |
| `NEXT_PUBLIC_SUPABASE_URL` | If using Supabase | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | If using Supabase | |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Never expose to client |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Same as site URL |
| `STRIPE_SECRET_KEY` | Billing | |
| `STRIPE_WEBHOOK_SECRET` | Billing | |
| `STRIPE_PRICE_MONTHLY` / `ANNUAL` | Billing | |
| `OPENAI_API_KEY` | AI features | NLP + insights |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` |
| `XAI_API_KEY` or `GROK_API_KEY` | Optional | Grok fallback |
| `NEXT_PUBLIC_POSTHOG_KEY` | Analytics | Optional |
| `NEXT_PUBLIC_POSTHOG_HOST` | Analytics | Optional |
| `NEXT_PUBLIC_APP_VERSION` | Optional | Shown in `/api/health` |

### Google sign-in (Supabase Auth)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **OAuth 2.0 Client** (Web).
2. **Authorized JavaScript origins:** `https://ryanbudget.me` (and `http://localhost:3000` for dev).
3. **Authorized redirect URI:** `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback` (copy from Supabase → Authentication → Providers → Google).
4. Supabase Dashboard → **Authentication** → **Providers** → enable **Google**, paste Client ID + Secret.
5. Supabase → **Authentication** → **URL configuration**:
   - **Site URL:** `https://ryanbudget.me`
   - **Redirect URLs:** `https://ryanbudget.me/auth/callback`, `http://localhost:3000/auth/callback`
   - Use the **exact** path above (no `?next=` query on the allow list)
6. Redeploy with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set (required; demo-only mode has no Google OAuth).

OAuth uses `@supabase/ssr` so the PKCE code verifier is stored in cookies (required for Next.js). Always start sign-in and complete the callback on the **same host** (e.g. always `https://ryanbudget.me`, not mixing `www` and apex).

## Security headers

Configure in `next.config.ts` (or Vercel headers):

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=()`

Rate limiting is applied on API routes via `src/lib/api/rate-limit.ts` (in-memory; use Redis/KV at scale).

## CI/CD (GitHub Actions)

See `.github/workflows/ci.yml`:

- Install, lint, test, build on pull requests and `main`.

## Health check

- `GET /api/health` — returns `{ ok: true }` for uptime monitors.
- Do not link in marketing nav; use only in monitoring tools.

## Pre-launch smoke test

- [ ] Sign in / demo mode
- [ ] Natural language transaction (Premium / demo)
- [ ] Notification bell shows bill/budget alerts
- [ ] PDF export from Reports (Premium / demo)
- [ ] PWA install + offline shell
- [ ] Stripe checkout + webhook (test mode)
- [ ] Household invite link flow

## Web push (optional)

Browser notifications use the Notification API client-side. Full Web Push with VAPID requires:

1. Generate VAPID keys
2. Store subscriptions server-side
3. Extend `public/sw.js` with `push` event handler

Current build supports **local notifications** when the user grants permission from the notification center.

## VPS (PM2 + Nginx)

App listens on **127.0.0.1:3002**. Nginx proxies `ryanbudget.me` → that port.

### Deploy / restart

```bash
cd /var/www/ryanbudget.me
git pull
bash scripts/vps-deploy.sh
```

Or manually (**install before sourcing env** — `.env.production` sets `NODE_ENV=production`, which skips Tailwind/TypeScript if you install too early):

```bash
cd /var/www/ryanbudget.me
git pull
npm install --include=dev
set -a && source .env.production && set +a
npm run build

pm2 delete ryanbudget 2>/dev/null || true
pm2 start ecosystem.config.cjs --update-env
pm2 save
```

**Important:** use `exec_mode: fork` (already in `ecosystem.config.cjs`). Do not run Next.js in PM2 cluster mode — it will not bind port 3002.

If health check fails, run in foreground to see the error:

```bash
set -a && source .env.production && set +a
npm run start:prod
```

Verify locally on the server:

```bash
curl -s http://127.0.0.1:3002/api/health   # expect {"ok":true}
curl -sI https://ryanbudget.me/api/health    # expect HTTP/1.1 200
```

### 502 Bad Gateway

Nginx returns **502** when nothing is listening on port 3002 (app crashed or never started). This affects **all** routes, not just `/auth/callback`.

**During deploy:** `vps-deploy.sh` stops PM2 before rebuilding — the site will 502 for ~1–2 minutes. That is expected.

**Verify you deployed the latest OAuth fix:** after deploy, this must return **HTTP 200** (HTML spinner page), not 307:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3002/auth/callback
```

If you see **307**, the old server callback route is still active — run `git pull`, `npm run build`, and restart PM2.

```bash
pm2 status
pm2 logs ryanbudget --lines 80
ss -tlnp | grep 3002
```

Common fixes:

- **Build failed** after `git pull` (e.g. forgot `npm install` for `@supabase/ssr`) — rerun install + build, then `pm2 restart ryanbudget`
- **Port in use** — `ss -tlnp | grep 3002`; stop conflicting process or change port in `ecosystem.config.cjs` + Nginx
- **Missing env at runtime** — PM2 does not auto-load `.env.production`; export vars before `npm run build`, or use `pm2 start ecosystem.config.cjs --update-env` after sourcing env
- **OOM / crash loop** — check `pm2 logs`; increase VPS RAM or reduce other services on 3000/3001

Nginx site config should include:

```nginx
location / {
    proxy_pass http://127.0.0.1:3002;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
}
```
