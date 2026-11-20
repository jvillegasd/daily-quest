import { createHmac, timingSafeEqual } from 'crypto'

export interface OAuthSignInCheck {
  /** The OAuth provider's claim that it verified the email (e.g. Google's `email_verified`). */
  providerEmailVerified: boolean
  /** Id of the user that already has this email, or null when there is none. */
  existingUserId: string | null
  /** Whether that user already has this exact provider account (provider + providerAccountId) linked. */
  alreadyLinked: boolean
  /** User id from a valid link intent cookie, or null when no link was requested. */
  linkIntentUserId: string | null
}

export type OAuthSignInDecision = 'allow' | 'not-linked' | 'link-mismatch' | 'unverified'

/**
 * Decides whether an OAuth sign-in may proceed.
 *
 * Password accounts are created without proving email ownership, so an
 * existing user found by email may belong to someone else. An OAuth identity
 * is therefore only attached to an existing user when that user, while signed
 * in, asked to link it (a valid link intent for exactly that user). Otherwise it
 * may only sign in to a brand-new user or to the user it is already linked to.
 */
export function decideOAuthSignIn({
  providerEmailVerified,
  existingUserId,
  alreadyLinked,
  linkIntentUserId,
}: OAuthSignInCheck): OAuthSignInDecision {
  if (!providerEmailVerified) return 'unverified'
  if (linkIntentUserId !== null) {
    return existingUserId === linkIntentUserId ? 'allow' : 'link-mismatch'
  }
  if (existingUserId === null) return 'allow'
  return alreadyLinked ? 'allow' : 'not-linked'
}

// --- Link intent: proof that a signed-in user asked to link Google ----------

export const LINK_INTENT_COOKIE = 'dq-link-google'
export const LINK_INTENT_TTL_MS = 10 * 60 * 1000
const LINK_INTENT_PURPOSE = 'link-google'

export function linkIntentSecret(): string | null {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || null
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(`${LINK_INTENT_PURPOSE}:${payload}`).digest('base64url')
}

/** Creates a signed `userId.expiresAt.signature` token. */
export function createLinkIntent(userId: string, now: number, secret: string): string {
  const payload = `${userId}.${now + LINK_INTENT_TTL_MS}`
  return `${payload}.${sign(payload, secret)}`
}

/** Returns the user id from a valid, unexpired token, otherwise null. */
export function verifyLinkIntent(token: string | undefined, now: number, secret: string): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userId, expiresAt, signature] = parts
  const expiry = Number(expiresAt)
  if (!userId || !Number.isSafeInteger(expiry) || expiry <= now) return null
  const expected = Buffer.from(sign(`${userId}.${expiresAt}`, secret))
  const actual = Buffer.from(signature)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null
  return userId
}
