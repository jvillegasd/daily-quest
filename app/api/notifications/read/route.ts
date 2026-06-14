import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { parseBody, NotificationReadSchema } from '@/lib/validation/schemas'

// Mark the caller's notifications read. Body `{ ids }` marks those; omit to mark all.
// markRead is scoped to profile.id, so a user can only mark their own.
export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseBody(request, NotificationReadSchema)
  if (!parsed.ok) return parsed.response

  await db.notifications.markRead(profile.id, parsed.data.ids)
  return NextResponse.json({ ok: true })
}
