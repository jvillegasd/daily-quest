import { describe, it, expect, vi, beforeEach } from 'vitest'
import { auth } from '@/auth'
import { POST } from '@/app/api/rewards/[id]/claim/route'
import { useTestDb } from '../helpers/db'
import { makeRequest, makeParams } from '../helpers/route-caller'
import { seedFullHousehold, createReward } from '@/tests/factories'
import { prisma } from '@/lib/db/prisma'

vi.mock('@/lib/services/notifications.service', () => ({
  notificationsService: { sendRewardClaimed: vi.fn() },
}))

describe('POST /api/rewards/[id]/claim', () => {
  useTestDb()

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const req = makeRequest('POST', 'http://localhost/api/rewards/r1/claim')
    const res = await POST(req as any, { params: makeParams({ id: 'r1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when reward not found', async () => {
    const { user } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)

    const req = makeRequest('POST', 'http://localhost/api/rewards/nonexistent/claim')
    const res = await POST(req as any, { params: makeParams({ id: 'nonexistent' }) })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/not found/i)
  })

  it('returns 400 when not enough personal points', async () => {
    const { user, household, profile } = await seedFullHousehold()
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    // Profile has 0 points; reward costs 100
    const reward = await createReward(household.id, profile.id, { cost: 100, costType: 'PERSONAL' })

    const req = makeRequest('POST', `http://localhost/api/rewards/${reward.id}/claim`)
    const res = await POST(req as any, { params: makeParams({ id: reward.id }) })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/not enough personal points/i)
  })

  it('deducts personal points and creates claim on success', async () => {
    const { user, household, profile } = await seedFullHousehold()
    // Give profile enough points
    await prisma.profile.update({ where: { id: profile.id }, data: { personalPoints: 200 } })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const reward = await createReward(household.id, profile.id, { cost: 100, costType: 'PERSONAL' })

    const req = makeRequest('POST', `http://localhost/api/rewards/${reward.id}/claim`)
    const res = await POST(req as any, { params: makeParams({ id: reward.id }) })
    expect(res.status).toBe(200)

    const updated = await prisma.profile.findUniqueOrThrow({ where: { id: profile.id } })
    expect(updated.personalPoints).toBe(100)

    const claims = await prisma.rewardClaim.findMany({ where: { rewardId: reward.id } })
    expect(claims).toHaveLength(1)
  })

  it('deducts shared points when costType is SHARED', async () => {
    const { user, household, profile } = await seedFullHousehold()
    await prisma.household.update({ where: { id: household.id }, data: { sharedPoints: 500 } })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const reward = await createReward(household.id, profile.id, { cost: 100, costType: 'SHARED' })

    const req = makeRequest('POST', `http://localhost/api/rewards/${reward.id}/claim`)
    const res = await POST(req as any, { params: makeParams({ id: reward.id }) })
    expect(res.status).toBe(200)

    const updated = await prisma.household.findUniqueOrThrow({ where: { id: household.id } })
    expect(updated.sharedPoints).toBe(400)
  })

  it('returns 400 when non-repeatable reward already claimed', async () => {
    const { user, household, profile } = await seedFullHousehold()
    await prisma.profile.update({ where: { id: profile.id }, data: { personalPoints: 500 } })
    vi.mocked(auth).mockResolvedValue({ user: { id: user.id }, expires: '' } as any)
    const reward = await createReward(household.id, profile.id, { cost: 50, costType: 'PERSONAL', repeatable: false })

    // First claim — should succeed
    const req1 = makeRequest('POST', `http://localhost/api/rewards/${reward.id}/claim`)
    const res1 = await POST(req1 as any, { params: makeParams({ id: reward.id }) })
    expect(res1.status).toBe(200)

    // Second claim — should fail
    const req2 = makeRequest('POST', `http://localhost/api/rewards/${reward.id}/claim`)
    const res2 = await POST(req2 as any, { params: makeParams({ id: reward.id }) })
    expect(res2.status).toBe(400)
    const data = await res2.json()
    expect(data.error).toMatch(/already been claimed/i)
  })
})
