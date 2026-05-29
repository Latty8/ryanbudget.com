# Mobile expansion roadmap

## Phase 1: PWA (current — ship first)

The web app is installable via `manifest.ts` + `sw.js`:

- **Install prompt** — `PwaProvider` captures `beforeinstallprompt`
- **Offline** — network-first HTML; static asset cache; `offline.html` fallback
- **Offline drafts** — `src/lib/offline/transaction-drafts.ts` queues basic entries when offline
- **Touch targets** — `min-h-11`, `touch-manipulation`, `pb-safe` on modals

**Improve next:** 192/512 PNG icons, Background Sync API for draft replay, Share Target for receipt images.

## Phase 2: Capacitor wrapper (recommended for 80% native feel)

| Pros | Cons |
|------|------|
| Reuse entire Next.js UI | App Store review for finance apps |
| Camera + filesystem plugins | Need hosted URL or static export for some flows |
| Push via native plugins | Stripe/IAP may need native SDK |
| Faster than full RN rewrite | |

**Steps:**

1. `npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`
2. Point `webDir` to `.next` static export or production URL (`server.url` in config)
3. Add `@capacitor/camera` for receipt capture
4. Add `@capacitor/push-notifications` for real push
5. Use safe-area insets (already partially via `pb-safe`)

## Phase 3: React Native (if mobile becomes primary)

Choose **Expo** + shared packages:

- `@/lib/recurring/*`, `@/lib/ai/*`, `@/lib/billing/*` → npm workspace package
- Supabase JS client works on RN
- Rebuild UI with React Native Paper or custom fintech components

**When to choose RN:** offline-first mutations, App Store branding, complex gestures, or team with RN expertise.

## Native-feeling UX checklist

- Bottom tab bar on mobile (existing app shell)
- Pull-to-refresh on dashboard (touch handler)
- Haptic feedback on save (Capacitor Haptics)
- Swipe actions on transaction rows
- Biometric lock (Capacitor + secure storage)

## Offline data model

| Data | Offline read | Offline write |
|------|--------------|---------------|
| Transactions (demo/local) | Cached via Zustand persist | Draft queue → sync on online |
| Dashboard summary | Last computed snapshot | No |
| Receipts | Thumbnails in memory | Queue upload |

Production Supabase sync should use optimistic UI + conflict resolution per `user_id`.
