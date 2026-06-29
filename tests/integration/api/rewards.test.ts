import { describe, it, expect, vi } from 'vitest'
import { auth } from '@/auth'
import { POST } from '@/app/api/rewards/route'
import { PATCH, DELETE } from '@/app/api/rewards/[id]/route'
import { useTestDb } from '../helpers/db'
import { makeRequest, makeParams } from '../helpers/route-caller'
import { createHousehold, createProfile, createReward, createUser, seedFullHousehold } from '@/tests/factories'
import { prisma } from '@/lib/db/prisma'

describe('rewards admin CRUD', () => {
  useTestDb()

  it('lets admins create, edit, and delete rewards', async () => {
    const { user, household, profile } = await seedFullHousehold()
    await prisma.profile.update({ where: { id: profile.id }, data: { role: 'ADMIN' } })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)

    let res = await POST(makeRequest('POST', 'http://localhost/api/rewards', {
      title: 'Movie Night', type: 'VIRTUAL', cost: 5, costType: 'PERSONAL', icon: '🎬', repeatable: true, cooldownHours: 2,
    }) as any)
    expect(res.status).toBe(201)
    let data = await res.json()
    const rewardId = data.reward.id

    res = await PATCH(makeRequest('PATCH', `http://localhost/api/rewards/${rewardId}`, { title: 'Pizza Night', cost: 8 }) as any, { params: makeParams({ id: rewardId }) })
    expect(res.status).toBe(200)
    await expect(prisma.reward.findUniqueOrThrow({ where: { id: rewardId } })).resolves.toMatchObject({ title: 'Pizza Night', cost: 8, householdId: household.id })

    res = await DELETE(makeRequest('DELETE', `http://localhost/api/rewards/${rewardId}`) as any, { params: makeParams({ id: rewardId }) })
    expect(res.status).toBe(200)
    await expect(prisma.reward.findUnique({ where: { id: rewardId } })).resolves.toBeNull()
  })

  it('forbids members from create, edit, and delete', async () => {
    const { user, household, profile } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const reward = await createReward(household.id, profile.id)

    expect((await POST(makeRequest('POST', 'http://localhost/api/rewards', { title: 'Nope', type: 'VIRTUAL', cost: 5, costType: 'PERSONAL' }) as any)).status).toBe(403)
    expect((await PATCH(makeRequest('PATCH', `http://localhost/api/rewards/${reward.id}`, { title: 'Nope' }) as any, { params: makeParams({ id: reward.id }) })).status).toBe(403)
    expect((await DELETE(makeRequest('DELETE', `http://localhost/api/rewards/${reward.id}`) as any, { params: makeParams({ id: reward.id }) })).status).toBe(403)
  })

  it('forbids cross-household admin edits', async () => {
    const { user, profile } = await seedFullHousehold()
    await prisma.profile.update({ where: { id: profile.id }, data: { role: 'ADMIN' } })
    const otherHousehold = await createHousehold('Other Rewards')
    const otherUser = await createUser({ email: 'other-reward@test.com' })
    const otherProfile = await createProfile(otherUser.id, otherHousehold.id, { role: 'ADMIN' })
    const reward = await createReward(otherHousehold.id, otherProfile.id)
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)

    const res = await PATCH(makeRequest('PATCH', `http://localhost/api/rewards/${reward.id}`, { title: 'Bad' }) as any, { params: makeParams({ id: reward.id }) })
    expect(res.status).toBe(403)
  })
})
