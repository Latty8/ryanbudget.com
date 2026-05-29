const buckets = new Map<string, { count: number; resetAt: number }>();

/** Simple in-memory rate limiter for API routes (per-instance; use Redis in production). */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { ok: true };
}
