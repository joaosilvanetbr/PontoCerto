/**
 * Rate Limiting - PontoCerto Security Module
 *
 * In-memory rate limiting for login attempts.
 * Tracks failed attempts by IP address.
 * - 5 attempts allowed per window
 * - 15-minute lockout after exceeding
 *
 * NOTE: For production with multiple Workers instances,
 * consider using Cloudflare KV or Durable Objects for distributed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockedUntil: number;
}

const attempts = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minute block

function getClientIp(req: Request): string {
  // Try Cloudflare-specific headers first
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

function cleanup() {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (entry.blocked && now > entry.blockedUntil) {
      attempts.delete(key);
    } else if (!entry.blocked && now > entry.resetAt) {
      attempts.delete(key);
    }
  }
}

export function checkRateLimit(req: Request): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  blocked: boolean;
} {
  cleanup();

  const ip = getClientIp(req);
  const now = Date.now();
  const entry = attempts.get(ip);

  if (entry?.blocked) {
    const resetIn = Math.max(0, Math.ceil((entry.blockedUntil - now) / 1000));
    return { allowed: false, remaining: 0, resetIn, blocked: true };
  }

  if (!entry) {
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetIn: WINDOW_MS / 1000, blocked: false };
  }

  if (now > entry.resetAt) {
    // Window expired, reset
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, resetIn: WINDOW_MS / 1000, blocked: false };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    // Block this IP
    const blockedEntry: RateLimitEntry = {
      count: entry.count,
      resetAt: entry.resetAt,
      blocked: true,
      blockedUntil: now + BLOCK_DURATION_MS,
    };
    attempts.set(ip, blockedEntry);
    return {
      allowed: false,
      remaining: 0,
      resetIn: BLOCK_DURATION_MS / 1000,
      blocked: true,
    };
  }

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count - 1,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
    blocked: false,
  };
}

export function recordFailedAttempt(req: Request): void {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = attempts.get(ip);

  if (!entry || now > entry.resetAt) {
    attempts.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
      blocked: false,
      blockedUntil: 0,
    });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(req: Request): void {
  const ip = getClientIp(req);
  attempts.delete(ip);
}
