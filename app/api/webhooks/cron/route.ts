import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { notificationsService } from '@/lib/services/notifications.service'

// Called by Coolify cron or external scheduler
export async function POST(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const households = await prisma.household.findMany({ select: { id: true } })

  for (const household of households) {
    await notificationsService.sendDailyDigest(household.id)
    await notificationsService.sendPendingReminder(household.id)
  }

  return NextResponse.json({ ok: true })
}
