import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { enforceRateLimit } from '@/lib/security/rate-limit'

// Intentionally public: not-yet-registered users follow an invite link and must
// see the household name before signing up. Abuse is mitigated by rate limiting.
export async function GET(request: Request) {
  const limited = enforceRateLimit(request, 'INVITE_VALIDATE')
  if (limited) return limited

  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 })

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { household: true },
  })
  if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date()) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  return NextResponse.json({ householdName: invitation.household.name })
}
