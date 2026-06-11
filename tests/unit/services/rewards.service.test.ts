import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db/implementation', () => ({
  db: {
    rewards: {
      findById: vi.fn(),
      getLastClaim: vi.fn(),
      claim: vi.fn(),
    },
    profiles: { findById: vi.fn() },
    households: { findById: vi.fn() },
  },
}))

vi.mock('@/lib/services/points.service', () => ({
  pointsService: { spendForReward: vi.fn() },
}))

vi.mock('@/lib/services/notifications.service', () => ({
  notificationsService: { sendRewardClaimed: vi.fn() },
}))

import { rewardsService } from '@/lib/services/rewards.service'
import { db } from '@/lib/db/implementation'
import { pointsService } from '@/lib/services/points.service'

const mockDb = vi.mocked(db)

function makeReward(overrides = {}) {
  return {
    id: 'reward-1',
    householdId: 'hh-1',
    createdById: 'profile-1',
    title: 'Night Off',
    description: null,
    icon: '🎉',
    type: 'PLEDGE',
    cost: 100,
    costType: 'PERSONAL',
    repeatable: false,
    cooldownHours: 24,
    timesClaimed: 0,
    createdAt: new Date(),
    ...overrides,
  } as const
}

function makeProfile(overrides = {}) {
  return {
    id: 'profile-1',
    personalPoints: 200,
    householdId: 'hh-1',
    ...overrides,
  } as any
}

beforeEach(() => {
  mockDb.rewards.findById.mockResolvedValue(makeReward() as any)
  mockDb.rewards.getLastClaim.mockResolvedValue(null)
  mockDb.rewards.claim.mockResolvedValue({ id: 'claim-1', rewardId: 'reward-1', claimedById: 'profile-1', claimedAt: new Date() })
  mockDb.profiles.findById.mockResolvedValue(makeProfile())
  mockDb.households.findById.mockResolvedValue({ id: 'hh-1', sharedPoints: 500 } as any)
})

describe('rewardsService.claim', () => {
  it('throws when reward not found', async () => {
    mockDb.rewards.findById.mockResolvedValue(null)
    await expect(rewardsService.claim('reward-1', 'profile-1', 'hh-1'))
      .rejects.toThrow('Reward not found')
  })

  it('throws when non-repeatable reward already claimed', async () => {
    mockDb.rewards.findById.mockResolvedValue(makeReward({ repeatable: false, timesClaimed: 1 }) as any)
    await expect(rewardsService.claim('reward-1', 'profile-1', 'hh-1'))
      .rejects.toThrow('already been claimed')
  })

  it('throws when repeatable reward is within cooldown', async () => {
    mockDb.rewards.findById.mockResolvedValue(makeReward({ repeatable: true, cooldownHours: 24 }) as any)
    mockDb.rewards.getLastClaim.mockResolvedValue({
      id: 'c1',
      rewardId: 'reward-1',
      claimedById: 'profile-1',
      claimedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    })
    await expect(rewardsService.claim('reward-1', 'profile-1', 'hh-1'))
      .rejects.toThrow('on cooldown')
  })

  it('allows claim when repeatable cooldown has expired', async () => {
    mockDb.rewards.findById.mockResolvedValue(makeReward({ repeatable: true, cooldownHours: 24 }) as any)
    mockDb.rewards.getLastClaim.mockResolvedValue({
      id: 'c1',
      rewardId: 'reward-1',
      claimedById: 'profile-1',
      claimedAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
    })
    await expect(rewardsService.claim('reward-1', 'profile-1', 'hh-1')).resolves.not.toThrow()
  })

  it('throws when not enough personal points', async () => {
    mockDb.profiles.findById.mockResolvedValue(makeProfile({ personalPoints: 50 }))
    await expect(rewardsService.claim('reward-1', 'profile-1', 'hh-1'))
      .rejects.toThrow('Not enough personal points')
  })

  it('throws when not enough shared points', async () => {
    mockDb.rewards.findById.mockResolvedValue(makeReward({ costType: 'SHARED', cost: 1000 }) as any)
    mockDb.households.findById.mockResolvedValue({ id: 'hh-1', sharedPoints: 50 } as any)
    await expect(rewardsService.claim('reward-1', 'profile-1', 'hh-1'))
      .rejects.toThrow('Not enough shared points')
  })

  it('calls pointsService.spendForReward and db.rewards.claim on success', async () => {
    await rewardsService.claim('reward-1', 'profile-1', 'hh-1')
    expect(vi.mocked(pointsService).spendForReward).toHaveBeenCalledWith('profile-1', 'hh-1', 100, 'PERSONAL')
    expect(mockDb.rewards.claim).toHaveBeenCalledWith('reward-1', 'profile-1')
  })
})

describe('rewardsService.getCooldownRemaining', () => {
  it('returns 0 when never claimed', async () => {
    mockDb.rewards.getLastClaim.mockResolvedValue(null)
    expect(await rewardsService.getCooldownRemaining('r1', 'u1', 24)).toBe(0)
  })

  it('returns remaining ms when within cooldown', async () => {
    mockDb.rewards.getLastClaim.mockResolvedValue({
      claimedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    } as any)
    const remaining = await rewardsService.getCooldownRemaining('r1', 'u1', 24)
    expect(remaining).toBeGreaterThan(0)
    expect(remaining).toBeLessThanOrEqual(22 * 60 * 60 * 1000 + 1000)
  })

  it('returns 0 when cooldown has expired', async () => {
    mockDb.rewards.getLastClaim.mockResolvedValue({
      claimedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    } as any)
    expect(await rewardsService.getCooldownRemaining('r1', 'u1', 24)).toBe(0)
  })
})
