import { prisma } from '@/lib/db/prisma'
import { notificationsService } from '@/lib/services/notifications.service'

// Shared daily-notifications job, run by the Coolify Scheduled Task
// (`node scripts/run-cron.cjs`) inside the running app container — no HTTP, no secret.
export async function runDailyNotifications(): Promise<{ households: number }> {
  const households = await prisma.household.findMany({ select: { id: true } })

  for (const household of households) {
    await notificationsService.sendDailyDigest(household.id)
    await notificationsService.sendPendingReminder(household.id)
  }

  return { households: households.length }
}
