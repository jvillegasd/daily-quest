import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { prisma } from '@/lib/db/prisma'
import { parseBody, InviteAcceptSchema } from '@/lib/validation/schemas'
import { enforceRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = enforceRateLimit(request, 'INVITE_ACCEPT')
  if (limited) return limited
  const parsed = await parseBody(request, InviteAcceptSchema)
  if (!parsed.ok) return parsed.response

  const accepted = await prisma.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({ where: { token: parsed.data.token } })
    if (!invitation || invitation.usedAt || invitation.expiresAt <= new Date()) return false

    const claimed = await tx.invitation.updateMany({
      where: { id: invitation.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    })
    if (claimed.count !== 1) return false

    await tx.profile.update({
      where: { id: profile.id },
      data: { householdId: invitation.householdId },
    })
    return true
  })

  if (!accepted) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
