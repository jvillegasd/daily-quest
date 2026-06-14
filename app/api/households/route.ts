import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { parseBody, HouseholdCreateSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = await parseBody(request, HouseholdCreateSchema)
  if (!parsed.ok) return parsed.response
  const household = await db.households.create(parsed.data.name)
  await db.categories.seedDefaults(household.id)
  await db.profiles.joinHousehold(profile.id, household.id)
  return NextResponse.json({ household })
}
