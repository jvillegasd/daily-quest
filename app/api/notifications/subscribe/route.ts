import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { endpoint, keys } = await request.json()
  await db.notifications.savePushSubscription(profile.id, endpoint, keys)
  return NextResponse.json({ ok: true })
}
