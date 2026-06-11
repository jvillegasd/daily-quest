import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  let profile = await db.profiles.findByUserId(user.id)
  if (!profile) {
    profile = await db.profiles.create({
      userId: user.id,
      email: user.email!,
      displayName: user.user_metadata?.full_name ?? user.email!.split('@')[0],
      avatarUrl: user.user_metadata?.avatar_url ?? null,
    })
  }

  const household = await db.households.create(name.trim())
  await db.categories.seedDefaults(household.id)
  await db.profiles.joinHousehold(profile.id, household.id)

  return NextResponse.json({ household })
}
