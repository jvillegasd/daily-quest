import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'

export async function GET() {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categories = await db.categories.findByHousehold(profile.householdId)
  return NextResponse.json({ categories })
}

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const category = await db.categories.create({ ...body, householdId: profile.householdId, isDefault: false })
  return NextResponse.json({ category }, { status: 201 })
}
