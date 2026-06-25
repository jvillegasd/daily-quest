import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'
import { POST as sendInvite } from '@/app/api/invite/route'
import { POST as acceptInvite } from '@/app/api/invite/accept/route'
import { GET as validateInvite } from '@/app/api/invite/validate/route'
import { prisma } from '@/lib/db/prisma'
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

  it('allows admins to send one-time invites', async () => {
    const household = await createHousehold()
    const user = await createUser({ email: 'admin@test.com' })
    await createProfile(user.id, household.id, { role: 'ADMIN', displayName: 'Hero' })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/invite', { email: 'friend@test.com' }, { 'x-forwarded-for': '1.1.1.1' })
    const res = await sendInvite(req as never)
    const invitation = await prisma.invitation.findFirstOrThrow({ where: { email: 'friend@test.com' } })

    expect(res.status).toBe(200)
    expect(invitation.householdId).toBe(household.id)
    expect(sendMock).toHaveBeenCalledOnce()
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({
      to: 'friend@test.com',
      subject: 'Hero invites you to Daily Quest',
      text: expect.stringContaining(`/invite?token=${invitation.token}`),
      html: expect.stringContaining('Your household adventure awaits'),
    }))
    expect(sendMock.mock.calls[0][0].html).toContain(`/invite?token=${invitation.token}`)
    expect(sendMock.mock.calls[0][0].html).toContain('Google or email')
    expect(sendMock.mock.calls[0][0].html).not.toContain(household.inviteCode)
  })

  it('returns 502 and removes the invite when Resend rejects the email', async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: 'Domain not verified' } })
    const household = await createHousehold()
    const user = await createUser({ email: 'admin2@test.com' })
    await createProfile(user.id, household.id, { role: 'ADMIN' })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/invite', { email: 'friend@test.com' }, { 'x-forwarded-for': '3.3.3.3' })
    const res = await sendInvite(req as never)
    const data = await res.json()

    expect(res.status).toBe(502)
    expect(data.error).toBe('Domain not verified')
    await expect(prisma.invitation.findFirstOrThrow({ where: { email: 'friend@test.com' } })).rejects.toThrow()
  })

  it('returns 403 for non-admin household members', async () => {
    const household = await createHousehold()
    const user = await createUser({ email: 'member@test.com' })
    await createProfile(user.id, household.id, { role: 'MEMBER' })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/invite', { email: 'friend@test.com' }, { 'x-forwarded-for': '2.2.2.2' })
    const res = await sendInvite(req as never)

    expect(res.status).toBe(403)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('rejects old household inviteCode links', async () => {
    const household = await createHousehold()
    const req = makeRequest('GET', `http://localhost/api/invite/validate?token=${household.inviteCode}`, undefined, { 'x-forwarded-for': '4.4.4.4' })
    const res = await validateInvite(req as never)

    expect(res.status).toBe(404)
  })

  it('marks an invite used after first accept', async () => {
    const household = await createHousehold()
    const user = await createUser({ email: 'new@test.com' })
    const profile = await createProfile(user.id)
    const invitation = await prisma.invitation.create({
      data: {
        householdId: household.id,
        email: 'new@test.com',
        token: 'one-time-token',
        expiresAt: new Date(Date.now() + 60_000),
      },
    })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const req = () => makeRequest('POST', 'http://localhost/api/invite/accept', { token: invitation.token }, { 'x-forwarded-for': '5.5.5.5' })
    const first = await acceptInvite(req() as never)
    const second = await acceptInvite(req() as never)

    expect(first.status).toBe(200)
    expect(second.status).toBe(404)
    await expect(prisma.profile.findUniqueOrThrow({ where: { id: profile.id } })).resolves.toMatchObject({ householdId: household.id })
    await expect(prisma.invitation.findUniqueOrThrow({ where: { id: invitation.id } })).resolves.toMatchObject({ usedAt: expect.any(Date) })
  })
})
