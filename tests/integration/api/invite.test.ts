import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'
import { POST } from '@/app/api/invite/route'
import { useTestDb } from '../helpers/db'
import { makeRequest } from '../helpers/route-caller'
import { createHousehold, createProfile, createUser } from '@/tests/factories'

const sendMock = vi.hoisted(() => vi.fn().mockResolvedValue({}))

vi.mock('resend', () => ({
  Resend: vi.fn(() => ({ emails: { send: sendMock } })),
}))

describe('POST /api/invite', () => {
  useTestDb()

  beforeEach(() => {
    sendMock.mockClear()
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost'
    process.env.RESEND_API_KEY = 'test-key'
    process.env.RESEND_FROM_EMAIL = 'test@example.com'
  })

  it('allows admins to send invites', async () => {
    const household = await createHousehold()
    const user = await createUser({ email: 'admin@test.com' })
    await createProfile(user.id, household.id, { role: 'ADMIN' })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/invite', { email: 'friend@test.com' }, { 'x-forwarded-for': '1.1.1.1' })
    const res = await POST(req as never)

    expect(res.status).toBe(200)
    expect(sendMock).toHaveBeenCalledOnce()
  })

  it('returns 502 when Resend rejects the email', async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'Domain not verified' } })
    const household = await createHousehold()
    const user = await createUser({ email: 'admin2@test.com' })
    await createProfile(user.id, household.id, { role: 'ADMIN' })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/invite', { email: 'friend@test.com' }, { 'x-forwarded-for': '3.3.3.3' })
    const res = await POST(req as never)
    const data = await res.json()

    expect(res.status).toBe(502)
    expect(data.error).toBe('Domain not verified')
  })

  it('returns 403 for non-admin household members', async () => {
    const household = await createHousehold()
    const user = await createUser({ email: 'member@test.com' })
    await createProfile(user.id, household.id, { role: 'MEMBER' })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/invite', { email: 'friend@test.com' }, { 'x-forwarded-for': '2.2.2.2' })
    const res = await POST(req as never)

    expect(res.status).toBe(403)
    expect(sendMock).not.toHaveBeenCalled()
  })
})
