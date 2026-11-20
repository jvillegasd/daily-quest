import { describe, it, expect } from 'vitest'
import {
  decideOAuthSignIn,
  createLinkIntent,
  verifyLinkIntent,
  LINK_INTENT_TTL_MS,
  type OAuthSignInCheck,
} from '@/lib/auth/oauth-linking'

const base: OAuthSignInCheck = {
  providerEmailVerified: true,
  existingUserId: null,
  alreadyLinked: false,
  linkIntentUserId: null,
}

describe('decideOAuthSignIn', () => {
  it('allows a verified email with no existing user', () => {
    expect(decideOAuthSignIn(base)).toBe('allow')
  })

  it('allows a verified email already linked to the existing user', () => {
    expect(decideOAuthSignIn({ ...base, existingUserId: 'u1', alreadyLinked: true })).toBe('allow')
  })

  it('refuses to link to an existing user found only by email', () => {
    expect(decideOAuthSignIn({ ...base, existingUserId: 'u1' })).toBe('not-linked')
  })

  it('links when the signed-in user asked to link and owns the email', () => {
    expect(decideOAuthSignIn({ ...base, existingUserId: 'u1', linkIntentUserId: 'u1' })).toBe('allow')
  })

  it('refuses a link intent for a different user than the email owner', () => {
    expect(decideOAuthSignIn({ ...base, existingUserId: 'victim', linkIntentUserId: 'attacker' })).toBe('link-mismatch')
  })

  it('refuses a link intent when the Google email has no user', () => {
    expect(decideOAuthSignIn({ ...base, linkIntentUserId: 'u1' })).toBe('link-mismatch')
  })

  it('refuses an unverified provider email, even with a link intent', () => {
    expect(decideOAuthSignIn({ ...base, providerEmailVerified: false })).toBe('unverified')
    expect(
      decideOAuthSignIn({ ...base, providerEmailVerified: false, existingUserId: 'u1', linkIntentUserId: 'u1' }),
    ).toBe('unverified')
  })
})

describe('link intent token', () => {
  const secret = 'test-secret'
  const now = 1_700_000_000_000

  it('round-trips the user id', () => {
    expect(verifyLinkIntent(createLinkIntent('u1', now, secret), now, secret)).toBe('u1')
  })

  it('rejects an expired token', () => {
    const token = createLinkIntent('u1', now, secret)
    expect(verifyLinkIntent(token, now + LINK_INTENT_TTL_MS, secret)).toBeNull()
  })

  it('rejects a token signed with another secret', () => {
    expect(verifyLinkIntent(createLinkIntent('u1', now, 'other'), now, secret)).toBeNull()
  })

  it('rejects a token whose user id was swapped', () => {
    const [, expiresAt, signature] = createLinkIntent('u1', now, secret).split('.')
    expect(verifyLinkIntent(`u2.${expiresAt}.${signature}`, now, secret)).toBeNull()
  })

  it('rejects a token whose expiry was extended', () => {
    const [userId, expiresAt, signature] = createLinkIntent('u1', now, secret).split('.')
    expect(verifyLinkIntent(`${userId}.${Number(expiresAt) + 1}.${signature}`, now, secret)).toBeNull()
  })

  it('rejects missing and malformed tokens', () => {
    expect(verifyLinkIntent(undefined, now, secret)).toBeNull()
    expect(verifyLinkIntent('', now, secret)).toBeNull()
    expect(verifyLinkIntent('garbage', now, secret)).toBeNull()
    expect(verifyLinkIntent('u1.notanumber.sig', now, secret)).toBeNull()
  })
})
