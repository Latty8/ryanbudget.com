# Post-launch roadmap

## Shipped in this phase

- **Receipt OCR** — OpenAI Vision + heuristic fallback; auto-scan on upload; form auto-fill (`src/lib/receipts/receipt-scan.ts`)
- **AI financial coach** — Weekly insights, goal predictions, spending habits, custom what-if (`src/lib/ai/financial-coach.ts`)
- **PWA** — Offline banner, draft queue, SW v4, manifest shortcuts (`docs/MOBILE-ROADMAP.md`)

## Next priorities

| Track | Items |
|-------|--------|
| Mobile | Capacitor wrapper, camera capture, native push |
| i18n | French, Portuguese; `Intl` date/number per locale |
| Monetization | AI usage metering, referral codes, in-app upgrade comparison |
| Enterprise | Feature flags (GrowthBook), team seats, GDPR export API |
| Receipts | Tesseract fallback server-side, delete storage objects on remove |

## Environment

- `OPENAI_API_KEY` — receipt vision + AI insights/coach
- `OPENAI_VISION_MODEL` — optional, default `gpt-4o-mini`
- `XAI_API_KEY` — Grok fallback for insights/what-if
