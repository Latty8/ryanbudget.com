# Launch checklist — Paycheck Planner

Use this before going live. Pair with [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for env vars and CI.

## Security

- [ ] All Supabase tables have RLS enabled; policies scoped to `auth.uid()`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only (never `NEXT_PUBLIC_*`)
- [ ] Stripe webhook secret configured; test mode vs live keys verified
- [ ] API routes rate-limited (`src/lib/api/rate-limit.ts`)
- [ ] Security headers in `next.config.ts` (frame deny, nosniff, referrer policy)
- [ ] Share links expire (30-day in-memory; migrate to DB for production scale)
- [ ] No secrets in client bundle (`npm run build` + grep for keys)
- [ ] Session cookies `httpOnly` / secure in production

## Feature completeness

- [ ] Bi-weekly recurring + paycheck projections verified
- [ ] Natural language transactions (Premium + demo)
- [ ] Notifications center + optional browser permission
- [ ] PDF / share report (Premium + demo)
- [ ] Public template gallery (`/templates`) without login
- [ ] Household invite flow (`/household/join?token=`)
- [ ] Demo mode unlocks Premium (`DemoLaunchButton`)
- [ ] Custom `ConfirmDialog` on destructive actions
- [ ] Receipt upload limits (free vs premium)
- [ ] i18n EN/ES in Settings
- [ ] Help center (`/help`) and marketing landing

## Testing

```bash
npm run test:run      # Vitest unit/integration
npm run test:e2e      # Playwright (starts dev server)
```

Coverage focus:
- Recurring: `src/lib/recurring/*.test.ts`
- AI parse: `src/lib/ai/parse-transaction.test.ts`
- Premium gating: `src/lib/billing/premium.test.ts`
- Dashboard: `src/lib/dashboard/compute-summary.test.ts`
- Confirm dialog: `src/components/providers/confirm-dialog-provider.test.tsx`

E2E:
- `e2e/critical-flows.spec.ts` — signed-in smoke
- `e2e/demo-mode.spec.ts` — no-login demo
- `e2e/transaction-flow.spec.ts` — add transaction
- `e2e/onboarding.spec.ts` — onboarding / demo path

## Performance benchmarks (targets)

| Metric | Target |
|--------|--------|
| Lighthouse Performance (mobile) | ≥ 75 |
| LCP | < 2.5s |
| Transaction list (500+ rows) | Virtualized (`VirtualTransactionList`) |
| First load JS | Monitor via `next build` output |

Optimizations in place:
- TanStack Virtual for long transaction lists
- Dynamic import: dashboard charts, AI panel, changelog
- Recurring projection cache (`projectRecurringRuns`)
- Service worker excludes `/_next/` from stale cache

## Known limitations

- **Share links** use in-memory storage — resets on deploy/cold start; not multi-instance safe
- **Household invites** use in-memory server map in dev — production should persist invites
- **NLP AI** requires `OPENAI_API_KEY` (optional Grok); falls back to rules without keys
- **PDF export** is HTML + browser Print, not a binary PDF library
- **Plaid / Supabase** optional — app runs in demo/local mode without them
- **Web push** uses Notification API only; full VAPID push not configured

## Post-launch monitoring

1. **Uptime**: `GET /api/health` every 5 min (Vercel, Better Uptime, etc.)
2. **Errors**: Enable Sentry (`NEXT_PUBLIC_SENTRY_DSN`) when ready
3. **Analytics**: PostHog (`NEXT_PUBLIC_POSTHOG_KEY`) — page views + key events
4. **Stripe**: Dashboard for failed payments and webhook delivery
5. **Supabase**: Monitor DB size, slow queries, Storage usage for receipts

## Launch day smoke (15 min)

1. Homepage → Try demo → dashboard loads
2. Add transaction → appears in list
3. Recurring page shows bi-weekly payroll
4. `/templates` → duplicate (signed in) → budgets updated
5. Reports → export PDF (demo/premium)
6. Sign out → sign in → onboarding skip/demo
7. Mobile width (375px): nav, transaction modal, notifications bell

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Product | | |
| Security review | | |
