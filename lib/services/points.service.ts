import { db } from '@/lib/db/implementation'
import { getLevelFromPoints } from '@/lib/types'
import type { Task } from '@/lib/types'

const LEVEL_MILESTONES = [5, 10, 20, 30, 50]

export const pointsService = {
  async awardForTask(task: Task, userId: string) {
    const profile = await db.profiles.findById(userId)
    if (!profile) return

    const oldLevel = profile.level

    if (task.pointsType === 'PERSONAL') {
      const updated = await db.profiles.addPersonalPoints(userId, task.points)
      const newLevel = getLevelFromPoints(updated.personalPoints)
      if (newLevel !== oldLevel || LEVEL_MILESTONES.includes(newLevel)) {
        // Notify level up — handled by notifications service listening for this change
      }
    } else if (task.householdId) {
      await db.households.addSharedPoints(task.householdId, task.points)
    }
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
