import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { ROLE } from '@/lib/types'
import { parseBody, HouseholdCreateSchema, HouseholdPatchSchema } from '@/lib/validation/schemas'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = await parseBody(request, HouseholdCreateSchema)
  if (!parsed.ok) return parsed.response
  const household = await db.households.create(parsed.data.name, parsed.data.timezone)
  await db.categories.seedDefaults(household.id)
  await db.profiles.joinHousehold(profile.id, household.id, ROLE.ADMIN)
  return NextResponse.json({ household })
}

export async function PATCH(request: Request) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (profile.role !== ROLE.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const parsed = await parseBody(request, HouseholdPatchSchema)
  if (!parsed.ok) return parsed.response
  const household = await db.households.updateTimezone(profile.householdId, parsed.data.timezone)
  return NextResponse.json({ household })
}
