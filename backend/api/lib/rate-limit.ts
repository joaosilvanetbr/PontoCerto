/**
 * Rate Limiting - PontoCerto Security Module
 *
 * Distributed rate limiting using Cloudflare D1.
 * Tracks failed attempts by IP address.
 * - 5 attempts allowed per window
 * - 15-minute lockout after exceeding
 */

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

function getClientIp(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  blocked: boolean;
}

export async function checkRateLimit(req: Request, db: D1Database): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const now = Date.now();

  const blocked = await db.prepare(
    "SELECT blocked_until FROM rate_limits WHERE ip = ? AND blocked_until > ?"
  ).bind(ip, now).first<{ blocked_until: number }>();

  if (blocked) {
    const resetIn = Math.ceil((blocked.blocked_until - now) / 1000);
    return { allowed: false, remaining: 0, resetIn, blocked: true };
  }

  const windowStart = now - WINDOW_MS;
  const row = await db.prepare(
    "SELECT COUNT(*) as count FROM rate_limits WHERE ip = ? AND attempted_at > ? AND blocked_until = 0"
  ).bind(ip, windowStart).first<{ count: number }>();

  const count = row?.count ?? 0;

  if (count >= MAX_ATTEMPTS) {
    await db.prepare(
      "DELETE FROM rate_limits WHERE ip = ?"
    ).bind(ip).run();
    await db.prepare(
      "INSERT INTO rate_limits (ip, attempted_at, blocked_until) VALUES (?, ?, ?)"
    ).bind(ip, now, now + BLOCK_DURATION_MS).run();
    return { allowed: false, remaining: 0, resetIn: BLOCK_DURATION_MS / 1000, blocked: true };
  }

  return {
    allowed: true,
    remaining: Math.max(0, MAX_ATTEMPTS - count - 1),
    resetIn: Math.ceil((WINDOW_MS - (now - windowStart)) / 1000),
    blocked: false,
  };
}

export async function recordFailedAttempt(req: Request, db: D1Database): Promise<void> {
  const ip = getClientIp(req);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  await db.prepare(
    "DELETE FROM rate_limits WHERE ip = ? AND attempted_at < ? AND blocked_until = 0"
  ).bind(ip, windowStart).run();
  await db.prepare(
    "INSERT INTO rate_limits (ip, attempted_at, blocked_until) VALUES (?, ?, 0)"
  ).bind(ip, now).run();
}

export async function clearAttempts(req: Request, db: D1Database): Promise<void> {
  const ip = getClientIp(req);
  await db.prepare("DELETE FROM rate_limits WHERE ip = ?").bind(ip).run();
}
