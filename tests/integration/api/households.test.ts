import { describe, it, expect, vi } from 'vitest'
import { auth } from '@/auth'
import { POST } from '@/app/api/households/route'
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
