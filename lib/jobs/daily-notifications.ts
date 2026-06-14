import { prisma } from '@/lib/db/prisma'
import { notificationsService } from '@/lib/services/notifications.service'

// Shared daily-notifications job. Invoked two ways:
//  - Coolify Scheduled Task running `node scripts/run-cron.cjs` inside the container (primary)
//  - the secured POST /api/webhooks/cron endpoint (manual / fallback trigger)
export async function runDailyNotifications(): Promise<{ households: number }> {
  const households = await prisma.household.findMany({ select: { id: true } })

  for (const household of households) {
    await notificationsService.sendDailyDigest(household.id)
    await notificationsService.sendPendingReminder(household.id)
  }

  return { households: households.length }
}
