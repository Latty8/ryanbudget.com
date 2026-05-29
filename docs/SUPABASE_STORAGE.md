# Supabase Storage — Receipts

Create a **private** bucket named `receipts` in your Supabase project.

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # server upload API only
```

## Suggested RLS (storage.objects)

Allow authenticated users to read/write only under their user folder:

- Path pattern: `{userId}/{transactionId}/{file}`

Without Supabase configured, uploads fall back to **local data URLs** in the browser (demo-friendly).
