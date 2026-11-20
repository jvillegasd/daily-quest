import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { parseBody, NotificationPreferenceSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = await parseBody(request, NotificationPreferenceSchema)
  if (!parsed.ok) return parsed.response
  const { eventType, enabled, dailyDigestTime, reminderHoursBefore } = parsed.data
  const pref = await db.notifications.upsert({
    profileId: profile.id,
    eventType,
    enabled: enabled ?? true,
    dailyDigestTime: dailyDigestTime ?? '08:00',
    reminderHoursBefore: reminderHoursBefore ?? 1,
  })
  return NextResponse.json({ pref })
}
