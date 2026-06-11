import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { eventType, enabled, dailyDigestTime, reminderHoursBefore } = await request.json()
  const pref = await db.notifications.upsert({
    profileId: profile.id,
    eventType,
    enabled: enabled ?? true,
    dailyDigestTime: dailyDigestTime ?? '08:00',
    reminderHoursBefore: reminderHoursBefore ?? 1,
  })
  return NextResponse.json({ pref })
}
