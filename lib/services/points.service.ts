import { db } from '@/lib/db/implementation'
import { getLevelFromPoints, getLevelKey, POINTS_TYPE } from '@/lib/types'
import type { Task } from '@/lib/types'

export type LevelUpResult = { newLevel: number; newTitleKey: string }

export const pointsService = {
  async awardForTask(task: Task, userId: string): Promise<LevelUpResult | null> {
    const profile = await db.profiles.findById(userId)
    if (!profile) return null

    const oldLevel = profile.level

    if (task.pointsType === POINTS_TYPE.PERSONAL) {
      const updated = await db.profiles.addPersonalPoints(userId, task.points)
      const newLevel = getLevelFromPoints(updated.personalPoints)
      if (newLevel !== oldLevel) {
        return { newLevel, newTitleKey: getLevelKey(newLevel) }
      }
      return null
    } else if (task.householdId) {
      await db.households.addSharedPoints(task.householdId, task.points)
    }
    return null
  },

  async spendForReward(
    profileId: string,
    householdId: string,
    amount: number,
    costType: 'PERSONAL' | 'SHARED'
  ) {
    if (costType === 'PERSONAL') {
      return db.profiles.deductPersonalPoints(profileId, amount)
    } else {
      return db.households.deductSharedPoints(householdId, amount)
    }
  },

  async getLeaderboard(householdId: string) {
    const profiles = await db.profiles.findByHousehold(householdId)
    return profiles.sort((a, b) => b.personalPoints - a.personalPoints)
  },
}
