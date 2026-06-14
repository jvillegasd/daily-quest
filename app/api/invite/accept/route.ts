import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { parseBody, InviteAcceptSchema } from '@/lib/validation/schemas'
import { enforceRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = enforceRateLimit(request, 'INVITE_ACCEPT')
  if (limited) return limited
  const parsed = await parseBody(request, InviteAcceptSchema)
  if (!parsed.ok) return parsed.response
  const household = await db.households.findByInviteCode(parsed.data.token)
  if (!household) return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
  await db.profiles.joinHousehold(profile.id, household.id)
  return NextResponse.json({ ok: true })
}
