import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { NOTIFICATION_FEED_LIMIT } from '@/lib/constants'

// In-app notification feed for the current user (bell dropdown).
export async function GET() {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [items, unread] = await Promise.all([
    db.notifications.list(profile.id, NOTIFICATION_FEED_LIMIT),
    db.notifications.countUnread(profile.id),
  ])
  return NextResponse.json({ items, unread })
}
