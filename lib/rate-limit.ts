/**
 * Basic in-memory sliding-window rate limiter for public endpoints. It lives in
 * the serverless instance's memory, so it's a first line of defense against
 * bursts/abuse from a single source, not a distributed guarantee — for
 * cross-instance accuracy (and to protect Twilio spend once SMS is live),
 * upgrade to Upstash / Vercel KV.
 */
const store = new Map<string, number[]>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const cutoff = now - windowMs;
  const hits = (store.get(key) ?? []).filter((t) => t > cutoff);

  if (hits.length >= limit) {
    store.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((hits[0] + windowMs - now) / 1000) };
  }

  hits.push(now);
  store.set(key, hits);
  // crude cap so the map can't grow unbounded on a stateless instance
  if (store.size > 10_000) store.clear();
  return { ok: true, retryAfter: 0 };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
