import { describe, it, expect, vi } from 'vitest'
import { auth } from '@/auth'
import { POST } from '@/app/api/households/admin-transfer/route'
import { prisma } from '@/lib/db/prisma'
import { useTestDb } from '../helpers/db'
import { makeRequest } from '../helpers/route-caller'
import { createHousehold, createProfile, createUser } from '@/tests/factories'

describe('POST /api/households/admin-transfer', () => {
  useTestDb()

  it('transfers admin to another member in the same household', async () => {
    const household = await createHousehold()
    const adminUser = await createUser({ email: 'admin-transfer@test.com' })
    const memberUser = await createUser({ email: 'member-transfer@test.com' })
    const admin = await createProfile(adminUser.id, household.id, { role: 'ADMIN' })
    const member = await createProfile(memberUser.id, household.id, { role: 'MEMBER' })
    vi.mocked(auth).mockResolvedValue({ user: { id: adminUser.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/households/admin-transfer', { targetProfileId: member.id })
    const res = await POST(req as never)

    expect(res.status).toBe(200)
    await expect(prisma.profile.findUniqueOrThrow({ where: { id: admin.id } })).resolves.toMatchObject({ role: 'MEMBER' })
    await expect(prisma.profile.findUniqueOrThrow({ where: { id: member.id } })).resolves.toMatchObject({ role: 'ADMIN' })
  })

  it('returns 403 for non-admins', async () => {
    const household = await createHousehold()
    const memberUser = await createUser({ email: 'member-no-transfer@test.com' })
    const targetUser = await createUser({ email: 'target-no-transfer@test.com' })
    const member = await createProfile(memberUser.id, household.id, { role: 'MEMBER' })
    const target = await createProfile(targetUser.id, household.id, { role: 'MEMBER' })
    vi.mocked(auth).mockResolvedValue({ user: { id: memberUser.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/households/admin-transfer', { targetProfileId: target.id })
    const res = await POST(req as never)

    expect(res.status).toBe(403)
    await expect(prisma.profile.findUniqueOrThrow({ where: { id: member.id } })).resolves.toMatchObject({ role: 'MEMBER' })
  })

  it('returns 404 when target is outside the household', async () => {
    const household = await createHousehold()
    const otherHousehold = await createHousehold('Other Household')
    const adminUser = await createUser({ email: 'admin-outside@test.com' })
    const targetUser = await createUser({ email: 'target-outside@test.com' })
    await createProfile(adminUser.id, household.id, { role: 'ADMIN' })
    const target = await createProfile(targetUser.id, otherHousehold.id, { role: 'MEMBER' })
    vi.mocked(auth).mockResolvedValue({ user: { id: adminUser.id }, expires: '' } as never)

    const req = makeRequest('POST', 'http://localhost/api/households/admin-transfer', { targetProfileId: target.id })
    const res = await POST(req as never)

    expect(res.status).toBe(404)
  })
})
