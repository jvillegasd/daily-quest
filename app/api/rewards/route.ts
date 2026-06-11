import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { rewardsService } from '@/lib/services/rewards.service'

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return db.profiles.findByUserId(user.id)
}

export async function GET() {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rewards = await rewardsService.getByHousehold(profile.householdId)
  return NextResponse.json({ rewards })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const reward = await rewardsService.create({
    ...body,
    householdId: profile.householdId,
    createdById: profile.id,
  })
  return NextResponse.json({ reward }, { status: 201 })
}
