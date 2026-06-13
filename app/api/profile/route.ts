import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { prisma } from '@/lib/db/prisma'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locale-context'
import type { Locale } from '@/lib/i18n/locale-context'

export async function PATCH(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Partial<{ displayName: string; avatarUrl: string; locale: string }> = {}

  if (typeof body.locale === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(body.locale)) {
    updates.locale = body.locale as Locale
  }
  if (typeof body.displayName === 'string') updates.displayName = body.displayName
  if (typeof body.avatarUrl === 'string') updates.avatarUrl = body.avatarUrl

  const updated = await db.profiles.update(profile.id, updates)
  return NextResponse.json({ profile: updated })
}

export async function DELETE() {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.$transaction(async (tx) => {
    // Nullify optional profile references in tasks
    await tx.task.updateMany({
      where: { assignedToId: profile.id },
      data: { assignedToId: null },
    })
    await tx.task.updateMany({
      where: { completedById: profile.id },
      data: { completedById: null },
    })

    // Delete tasks this user created (createdById is non-nullable)
    await tx.task.deleteMany({ where: { createdById: profile.id } })

    // Delete reward claims by this user, then rewards they created
    await tx.rewardClaim.deleteMany({ where: { claimedById: profile.id } })
    await tx.rewardClaim.deleteMany({ where: { reward: { createdById: profile.id } } })
    await tx.reward.deleteMany({ where: { createdById: profile.id } })

    // Delete the user — cascades Profile, Account, Session,
    // NotificationPreference, PushSubscription
    await tx.user.delete({ where: { id: profile.userId } })
  })

  return NextResponse.json({ ok: true })
}
