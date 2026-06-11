import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { rewardsService } from '@/lib/services/rewards.service'

export async function GET() {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rewards = await rewardsService.getByHousehold(profile.householdId)
  return NextResponse.json({ rewards })
}

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const reward = await rewardsService.create({ ...body, householdId: profile.householdId, createdById: profile.id })
  return NextResponse.json({ reward }, { status: 201 })
}
