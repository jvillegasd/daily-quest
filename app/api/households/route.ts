import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const household = await db.households.create(name.trim())
  await db.categories.seedDefaults(household.id)
  await db.profiles.joinHousehold(profile.id, household.id)
  return NextResponse.json({ household })
}
