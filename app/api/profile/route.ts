import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { prisma } from '@/lib/db/prisma'
import { ROLE } from '@/lib/types'
import { parseBody, ProfilePatchSchema } from '@/lib/validation/schemas'

export async function PATCH(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseBody(request, ProfilePatchSchema)
  if (!parsed.ok) return parsed.response

  const updated = await db.profiles.update(profile.id, parsed.data)
  return NextResponse.json({ profile: updated })
}

export async function DELETE() {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.$transaction(async (tx) => {
    // Handle household membership before removing the user
    if (profile.householdId) {
      const members = await tx.profile.findMany({
        where: { householdId: profile.householdId },
        select: { id: true, role: true },
      })

      if (members.length === 1) {
        // Sole member — delete the whole household (cascades tasks, rewards, categories)
        await tx.household.delete({ where: { id: profile.householdId } })
      } else if (profile.role === ROLE.ADMIN) {
        const otherAdmins = members.filter((m) => m.id !== profile.id && m.role === ROLE.ADMIN)
        if (otherAdmins.length === 0) {
          // Only admin with other members — promote the first other member
          const nextAdmin = members.find((m) => m.id !== profile.id)!
          await tx.profile.update({ where: { id: nextAdmin.id }, data: { role: ROLE.ADMIN } })
        }
      }
    }

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
