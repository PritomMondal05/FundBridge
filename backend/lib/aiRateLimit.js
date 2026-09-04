const buckets = new Map();

function prune(now) {
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function consumeRateLimit(key, { limit = 20, windowMs = 15 * 60 * 1000 } = {}) {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: windowMs };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, existing.resetAt - now) };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterMs: existing.resetAt - now };
}

export function rateLimitHeaders(result) {
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'Retry-After': String(Math.ceil((result.retryAfterMs || 0) / 1000))
  };
}
