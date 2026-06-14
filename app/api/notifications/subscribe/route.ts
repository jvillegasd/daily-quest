import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { parseBody, PushSubscribeSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = await parseBody(request, PushSubscribeSchema)
  if (!parsed.ok) return parsed.response
  const { endpoint, keys } = parsed.data
  await db.notifications.savePushSubscription(profile.id, endpoint, keys)
  return NextResponse.json({ ok: true })
}
