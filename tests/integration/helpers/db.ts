import { beforeEach, afterAll } from 'vitest'
import { db } from '@/lib/db/implementation'
import { prisma } from '@/lib/db/prisma'

export function useTestDb() {
  beforeEach(async () => {
    await prisma.$executeRaw`TRUNCATE TABLE
      "PushSubscription", "NotificationPreference", "RewardClaim",
      "Reward", "Task", "Category", "Profile",
      "Session", "VerificationToken", "Account", "User", "Household"
      CASCADE`
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  return db
}
