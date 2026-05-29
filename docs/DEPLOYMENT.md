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
