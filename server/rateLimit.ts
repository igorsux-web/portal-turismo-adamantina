type Bucket = { count: number; resetAt: number };

type RateLimitInput = {
  key: string;
  limit: number;
  windowMs: number;
  now?: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit({ key, limit, windowMs, now = Date.now() }: RateLimitInput) {
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + windowMs };
    buckets.set(key, next);
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: next.resetAt };
  }

  current.count += 1;
  const allowed = current.count <= limit;
  return { allowed, remaining: Math.max(0, limit - current.count), resetAt: current.resetAt };
}

export function clearRateLimitBuckets() {
  buckets.clear();
}

export function getRequestIp(req: { ip?: string; headers?: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}
