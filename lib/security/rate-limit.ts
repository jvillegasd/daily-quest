import { NextResponse } from 'next/server'
import { TIME } from '@/lib/constants'

/**
 * Named rate-limit policies keyed by bucket. Keeps limits/windows out of route
 * handlers (no magic numbers) and documented in one place.
 */
export const RATE_LIMIT = {
  REGISTER: { limit: 5, windowMs: 15 * TIME.MINUTE_MS },
  LOGIN: { limit: 10, windowMs: 15 * TIME.MINUTE_MS },
  INVITE_VALIDATE: { limit: 20, windowMs: 5 * TIME.MINUTE_MS },
  INVITE_SEND: { limit: 10, windowMs: TIME.HOUR_MS },
  INVITE_ACCEPT: { limit: 10, windowMs: 15 * TIME.MINUTE_MS },
  REWARD_CLAIM: { limit: 30, windowMs: TIME.MINUTE_MS },
} as const

type RateLimitBucket = keyof typeof RATE_LIMIT

/**
 * In-process fixed-window rate limiter. Zero-dependency, suited to the
 * single-instance deployment (see Dockerfile / docker-compose.prod.yml).
 *
 * Caveats (acceptable for current scale, documented intentionally):
 * - State is per-process: it resets on redeploy and is not shared across
 *   multiple instances. Move to a shared store (Redis) if the app is scaled out.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()
const MAX_ENTRIES = 10_000

function prune(now: number) {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    if (store.size > MAX_ENTRIES) prune(now)
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  entry.count += 1
  return entry.count <= limit
}

/**
 * Extracts the client IP used as the rate-limit key from `cf-connecting-ip`,
 * which Cloudflare overwrites on every request. `x-forwarded-for` and
 * `x-real-ip` are ignored because clients can set them. This relies on the
 * origin firewall accepting traffic from Cloudflare alone; requests without
 * the header (local dev, internal calls) share one bucket.
 */
export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')?.trim() || 'unknown'
}

export function tooManyRequests(): NextResponse {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
}

/**
 * Convenience guard: rate-limits `request` under a named policy (keyed by the
 * caller's IP) and returns a 429 response when exceeded, or null when the
 * request may proceed.
 */
export function enforceRateLimit(request: Request, bucket: RateLimitBucket): NextResponse | null {
  const { limit, windowMs } = RATE_LIMIT[bucket]
  const ip = clientIp(request)
  if (!rateLimit(`${bucket}:${ip}`, limit, windowMs)) return tooManyRequests()
  return null
}
