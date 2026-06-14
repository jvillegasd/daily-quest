import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { rewardsService } from '@/lib/services/rewards.service'
import { db } from '@/lib/db/implementation'
import { parseBody, RewardPatchSchema } from '@/lib/validation/schemas'

async function authorize(rewardId: string, householdId: string) {
  const reward = await db.rewards.findById(rewardId)
  if (!reward) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (reward.householdId !== householdId) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { reward }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await authorize(id, profile.householdId)
  if (error) return error
  const parsed = await parseBody(request, RewardPatchSchema)
  if (!parsed.ok) return parsed.response
  const reward = await rewardsService.update(id, parsed.data)
  return NextResponse.json({ reward })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await authorize(id, profile.householdId)
  if (error) return error
  await rewardsService.delete(id)
  return NextResponse.json({ ok: true })
}
