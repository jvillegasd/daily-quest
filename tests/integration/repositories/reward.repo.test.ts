import { describe, it, expect } from 'vitest'
import { useTestDb } from '../helpers/db'
import { seedFullHousehold, createReward } from '@/tests/factories'
import { prisma } from '@/lib/db/prisma'

describe('RewardRepository', () => {
  const db = useTestDb()

  it('creates a reward and finds it by household', async () => {
    const { household, profile } = await seedFullHousehold()
    const reward = await createReward(household.id, profile.id)

    const rewards = await db.rewards.findByHousehold(household.id)
    expect(rewards).toHaveLength(1)
    expect(rewards[0].id).toBe(reward.id)
  })

  it('claim creates a RewardClaim row and increments timesClaimed atomically', async () => {
    const { household, profile } = await seedFullHousehold()
    const reward = await createReward(household.id, profile.id)

    await db.rewards.claim(reward.id, profile.id)

    const claims = await prisma.rewardClaim.findMany({ where: { rewardId: reward.id } })
    expect(claims).toHaveLength(1)
    expect(claims[0].claimedById).toBe(profile.id)

    const updated = await prisma.reward.findUniqueOrThrow({ where: { id: reward.id } })
    expect(updated.timesClaimed).toBe(1)
  })

  it('getLastClaim returns null when never claimed', async () => {
    const { household, profile } = await seedFullHousehold()
    const reward = await createReward(household.id, profile.id)

    const lastClaim = await db.rewards.getLastClaim(reward.id, profile.id)
    expect(lastClaim).toBeNull()
  })

  it('getLastClaim returns most recent claim', async () => {
    const { household, profile } = await seedFullHousehold()
    const reward = await createReward(household.id, profile.id, { repeatable: true })

    await db.rewards.claim(reward.id, profile.id)
    await db.rewards.claim(reward.id, profile.id)

    const lastClaim = await db.rewards.getLastClaim(reward.id, profile.id)
    expect(lastClaim).not.toBeNull()
  })

  it('delete removes the reward', async () => {
    const { household, profile } = await seedFullHousehold()
    const reward = await createReward(household.id, profile.id)

    await db.rewards.delete(reward.id)
    const rewards = await db.rewards.findByHousehold(household.id)
    expect(rewards).toHaveLength(0)
  })
})
