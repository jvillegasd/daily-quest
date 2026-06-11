import { NextResponse } from 'next/server'
import { db } from '@/lib/db/implementation'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 })

  const household = await db.households.findByInviteCode(token)
  if (!household) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })

  return NextResponse.json({ householdName: household.name })
}
