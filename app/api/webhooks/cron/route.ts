import { NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db/prisma'
import { notificationsService } from '@/lib/services/notifications.service'

// Constant-time comparison (SHA-256 digests are equal length, so timingSafeEqual
// never throws and the comparison time is independent of how much matches).
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest())
}

// Called by Coolify cron or external scheduler
export async function POST(request: Request) {
  const auth = request.headers.get('authorization') ?? ''
  const secret = process.env.CRON_SECRET
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const households = await prisma.household.findMany({ select: { id: true } })

  for (const household of households) {
    await notificationsService.sendDailyDigest(household.id)
    await notificationsService.sendPendingReminder(household.id)
  }

  return NextResponse.json({ ok: true })
}
