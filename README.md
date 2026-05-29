# Paycheck Planner

Bi-weekly paycheck budgeting app built with **Next.js 16** (App Router), **Supabase**, **TanStack Query**, **Zustand**, and **Stripe**.

## Architecture

```
src/
├── app/              # Routes (App Router) + API routes
├── components/
│   ├── fintech/      # Main app UI (dashboard, transactions, …)
│   ├── marketing/    # Landing, SEO, waitlist
│   └── billing/      # Pricing & upgrade prompts
├── lib/
│   ├── recurring/    # Cadence math & projection (tested)
│   ├── dashboard/    # Summary & cash-flow aggregates
│   ├── ai/           # Privacy-safe AI (anonymized context only)
│   ├── billing/      # Premium gating
│   └── household/    # Role permissions
├── store/            # Zustand (client state + persistence)
└── test/factories/   # Test data builders
```

### Data flow

- **Client-first demo mode** when Supabase env vars are unset; `useAppDataStore` persists to localStorage.
- **Supabase** optional for auth, transactions, and future server-side recurring generation.
- **Middleware** protects app routes; marketing (`/`, `/pricing`, `/resources`) stays public.

### AI privacy

All LLM calls use `buildAnonymizedContext()` — category totals and aggregates only, never raw merchant strings or account numbers.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run test` | Vitest (watch) |
| `npm run test:run` | Vitest single run |
| `npm run test:e2e` | Playwright E2E |

## Testing

- **Unit tests**: recurring cadence, dashboard projections, premium gating, household permissions, optimistic transactions, NLP parser.
- **E2E**: sign-in, dashboard, recurring, budgets (`e2e/critical-flows.spec.ts`).
- **Factories**: `src/test/factories/budget.ts` — bi-weekly household scenarios.

## Feature flags

Set `NEXT_PUBLIC_FEATURE_<FLAG>=false` to disable:

- `ai_nlp_transactions`, `ai_multi_what_if`, `referral_program`, `blog_resources`, `waitlist_signup`

## Environment

Copy `.env.example` → `.env.local`. Key vars:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY` (optional — falls back to rules)
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SENTRY_DSN` (optional monitoring)

## Database

Apply in order:

1. `src/lib/supabase/schema.sql`
2. `src/lib/supabase/schema-billing.sql`

See `DEPLOYMENT.md` for production checklist.
