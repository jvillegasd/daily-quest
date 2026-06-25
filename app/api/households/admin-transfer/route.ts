import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { prisma } from '@/lib/db/prisma'
import { ROLE } from '@/lib/types'
import { parseBody, AdminTransferSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== ROLE.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const parsed = await parseBody(request, AdminTransferSchema)
  if (!parsed.ok) return parsed.response
  if (parsed.data.targetProfileId === profile.id) return NextResponse.json({ error: 'Choose another member' }, { status: 400 })

  const target = await prisma.profile.findFirst({
    where: { id: parsed.data.targetProfileId, householdId: profile.householdId },
  })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  await prisma.$transaction([
    prisma.profile.update({ where: { id: profile.id }, data: { role: ROLE.MEMBER } }),
    prisma.profile.update({ where: { id: target.id }, data: { role: ROLE.ADMIN } }),
  ])

  return NextResponse.json({ ok: true })
}
