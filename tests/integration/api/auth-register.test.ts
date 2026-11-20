import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import { useTestDb } from '../helpers/db'
import { makeRequest } from '../helpers/route-caller'
import { prisma } from '@/lib/db/prisma'

describe('POST /api/auth/register', () => {
  useTestDb()

  it('returns 400 when fields are missing', async () => {
    const req = makeRequest('POST', 'http://localhost/api/auth/register', { email: 'a@b.com' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })

  it('creates user, account, and profile on valid input', async () => {
    const req = makeRequest('POST', 'http://localhost/api/auth/register', {
      email: 'new@test.com',
      password: 'password123',
      name: 'New User',
    })
    const res = await POST(req as any)
    expect(res.status).toBe(201)

    const user = await prisma.user.findUnique({ where: { email: 'new@test.com' } })
    expect(user).not.toBeNull()

    const account = await prisma.account.findFirst({ where: { providerAccountId: 'new@test.com' } })
    expect(account).not.toBeNull()
    expect(account!.passwordHash).not.toBeNull()

    const profile = await prisma.profile.findUnique({ where: { userId: user!.id } })
    expect(profile).not.toBeNull()
    expect(profile!.displayName).toBe('New User')
  })

  it('returns 409 on duplicate email', async () => {
    const body = { email: 'dup@test.com', password: 'password123', name: 'User' }
    const req1 = makeRequest('POST', 'http://localhost/api/auth/register', body)
    await POST(req1 as any)

    const req2 = makeRequest('POST', 'http://localhost/api/auth/register', body)
    const res = await POST(req2 as any)
    expect(res.status).toBe(409)
  })

  it('refuses to add a password to an existing OAuth-only user', async () => {
    const victim = await prisma.user.create({ data: { email: 'victim@test.com', name: 'Victim' } })
    await prisma.account.create({
      data: { userId: victim.id, type: 'oidc', provider: 'google', providerAccountId: 'google-sub-1' },
    })

    const req = makeRequest('POST', 'http://localhost/api/auth/register', {
      email: 'victim@test.com',
      password: 'attacker-pass',
      name: 'Attacker',
    })
    const res = await POST(req as any)
    expect(res.status).toBe(409)

    const credentials = await prisma.account.findFirst({ where: { userId: victim.id, provider: 'credentials' } })
    expect(credentials).toBeNull()
  })
})
