import { db } from '@/lib/db/implementation'
import { pointsService } from './points.service'
import { notificationsService } from './notifications.service'
import type { CreateRewardInput, Reward } from '@/lib/types'

export const rewardsService = {
  async getByHousehold(householdId: string): Promise<Reward[]> {
    return db.rewards.findByHousehold(householdId)
  },

  async create(data: CreateRewardInput): Promise<Reward> {
    return db.rewards.create(data)
  },

  async update(id: string, data: Partial<CreateRewardInput>): Promise<Reward> {
    return db.rewards.update(id, data)
  },

  async delete(id: string): Promise<void> {
    return db.rewards.delete(id)
  },

  async claim(rewardId: string, claimedById: string, householdId: string) {
    const reward = await db.rewards.findById(rewardId)
    if (!reward) throw new Error('Reward not found')

    if (reward.repeatable) {
      const lastClaim = await db.rewards.getLastClaim(rewardId, claimedById)
      if (lastClaim) {
        const cooldownMs = reward.cooldownHours * 60 * 60 * 1000
        const timeSinceClaim = Date.now() - lastClaim.claimedAt.getTime()
        if (timeSinceClaim < cooldownMs) {
          const hoursLeft = Math.ceil((cooldownMs - timeSinceClaim) / (60 * 60 * 1000))
          throw new Error(`Reward on cooldown. Available in ${hoursLeft}h`)
        }
      }
    } else if (reward.timesClaimed > 0) {
      throw new Error('This reward has already been claimed')
    }

    const profile = await db.profiles.findById(claimedById)
    if (!profile) throw new Error('Profile not found')

    if (reward.costType === 'PERSONAL' && profile.personalPoints < reward.cost) {
      throw new Error('Not enough personal points')
    }
    if (reward.costType === 'SHARED') {
      const household = await db.households.findById(householdId)
      if (!household || household.sharedPoints < reward.cost) {
        throw new Error('Not enough shared points')
      }
    }

    await pointsService.spendForReward(claimedById, householdId, reward.cost, reward.costType)
    const claim = await db.rewards.claim(rewardId, claimedById)
    await notificationsService.sendRewardClaimed(reward, claimedById, householdId)
    return claim
  },

  async getCooldownRemaining(rewardId: string, userId: string, cooldownHours: number): Promise<number> {
    const lastClaim = await db.rewards.getLastClaim(rewardId, userId)
    if (!lastClaim) return 0
    const cooldownMs = cooldownHours * 60 * 60 * 1000
    const elapsed = Date.now() - lastClaim.claimedAt.getTime()
    return Math.max(0, cooldownMs - elapsed)
  },
}
