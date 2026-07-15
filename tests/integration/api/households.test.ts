import { describe, it, expect, vi } from 'vitest'
import { auth } from '@/auth'
import { PATCH, POST } from '@/app/api/households/route'
import { useTestDb } from '../helpers/db'
import { makeRequest } from '../helpers/route-caller'
import { createUser, createProfile } from '@/tests/factories'
import { prisma } from '@/lib/db/prisma'

describe('POST /api/households', () => {
  useTestDb()

  it('makes the household creator an admin', async () => {
    const user = await createUser({ email: 'owner@test.com' })
    const profile = await createProfile(user.id)
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/households', { name: 'Owner House' })
    const res = await POST(req as never)

    expect(res.status).toBe(200)
    const updated = await prisma.profile.findUniqueOrThrow({ where: { id: profile.id } })
    expect(updated.role).toBe('ADMIN')
    expect(updated.householdId).toBeTruthy()
  })
})

describe('PATCH /api/households', () => {
  useTestDb()

  it('lets an admin update the household timezone', async () => {
    const user = await createUser({ email: 'timezone@test.com' })
    const household = await prisma.household.create({ data: { name: 'Home' } })
    await createProfile(user.id, household.id, { role: 'ADMIN' })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as never)

    const res = await PATCH(makeRequest('PATCH', 'http://localhost/api/households', { timezone: 'America/Bogota' }) as never)

    expect(res.status).toBe(200)
    await expect(prisma.household.findUniqueOrThrow({ where: { id: household.id } })).resolves.toMatchObject({ timezone: 'America/Bogota' })
  })
})
