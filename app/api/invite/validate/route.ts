import { NextResponse } from 'next/server'
import { db } from '@/lib/db/implementation'
import { enforceRateLimit } from '@/lib/security/rate-limit'

// Intentionally public: not-yet-registered users follow an invite link and must
// see the household name before signing up. Abuse is mitigated by rate limiting.
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'INVITE_VALIDATE')
  if (limited) return limited

  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 })

  const household = await db.households.findByInviteCode(token)
  if (!household) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  return NextResponse.json({ householdName: household.name })
}
