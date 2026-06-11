import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return db.profiles.findByUserId(user.id)
}

export async function GET() {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categories = await db.categories.findByHousehold(profile.householdId)
  return NextResponse.json({ categories })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const category = await db.categories.create({
    ...body,
    householdId: profile.householdId,
    isDefault: false,
  })
  return NextResponse.json({ category }, { status: 201 })
}
