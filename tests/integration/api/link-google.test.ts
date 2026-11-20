import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { auth } from '@/auth'
import { POST } from '@/app/api/account/link-google/route'
import { useTestDb } from '../helpers/db'
import { createHousehold, createProfile, createUser } from '@/tests/factories'
import { LINK_INTENT_COOKIE, verifyLinkIntent } from '@/lib/auth/oauth-linking'

describe('POST /api/account/link-google', () => {
  useTestDb()

  beforeEach(() => {
    vi.stubEnv('AUTH_SECRET', 'test-secret')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('returns 401 when not signed in', async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const res = await POST()
    expect(res.status).toBe(401)
    expect(res.cookies.get(LINK_INTENT_COOKIE)).toBeUndefined()
  })

  it('sets a signed, httpOnly link intent for the signed-in user', async () => {
    const household = await createHousehold()
    const user = await createUser({ email: 'linker@test.com' })
    await createProfile(user.id, household.id)
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const res = await POST()
    expect(res.status).toBe(200)

    const cookie = res.cookies.get(LINK_INTENT_COOKIE)
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.path).toBe('/api/auth/callback')
    expect(verifyLinkIntent(cookie?.value, Date.now(), 'test-secret')).toBe(user.id)
  })
})
