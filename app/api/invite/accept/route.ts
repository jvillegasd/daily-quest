import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { token } = await request.json()
  const household = await db.households.findByInviteCode(token)
  if (!household) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  await db.profiles.joinHousehold(profile.id, household.id)
  return NextResponse.json({ ok: true })
}
