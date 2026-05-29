# Paycheck Planner — Vercel deployment checklist

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key |
| `OPENAI_API_KEY` | Optional | Enables live AI insights |
| `OPENAI_MODEL` | Optional | Default `gpt-4o-mini` |
| `XAI_API_KEY` or `GROK_API_KEY` | Optional | Grok fallback |
| `SENTRY_DSN` | Optional | Error monitoring |
| `STRIPE_SECRET_KEY` | Optional | Live checkout |
| `STRIPE_WEBHOOK_SECRET` | Optional | Subscription webhooks |
| `STRIPE_PRICE_MONTHLY` | Optional | Stripe Price ID |
| `STRIPE_PRICE_ANNUAL` | Optional | Stripe Price ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | Product analytics |

## Pre-deploy

- [ ] Run `npm run lint` and `npm run build`
- [ ] Apply Supabase schema from `src/lib/supabase/schema.sql`
- [ ] Set auth redirect URLs in Supabase dashboard
- [ ] Confirm RLS policies enabled on all tables
- [ ] Review `middleware.ts` public routes (`/login`, `/templates`, `/help`)

## Vercel

1. Import Git repository
2. Framework preset: **Next.js**
3. Add environment variables above
4. Deploy `main` branch
5. Enable **Vercel Analytics** (optional) in project settings
6. Configure custom domain + HTTPS (required for PWA install)

## Post-deploy smoke test

- [ ] Sign in / onboarding flow
- [ ] Dashboard AI insights refresh
- [ ] Duplicate a public template
- [ ] PWA install prompt on mobile Chrome
- [ ] Export JSON from Settings
- [ ] Offline page at `/offline.html`

## Security

- API routes use in-memory rate limiting (use Upstash Redis for multi-instance)
- AI endpoints receive **anonymized aggregates only** — no raw transaction descriptions
- Session cookies are `httpOnly` + `sameSite=lax`
- Apply `schema-billing.sql` for subscriptions, households, audit_log
- Supabase encrypts data at rest; enable audit logging in production dashboard
- Run Lighthouse on `/` and `/dashboard` before launch (target 90+ performance)
