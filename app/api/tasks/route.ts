import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { tasksService } from '@/lib/services/tasks.service'

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return db.profiles.findByUserId(user.id)
}

export async function GET() {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tasks = await tasksService.getByHousehold(profile.householdId)
  return NextResponse.json({ tasks })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const task = await tasksService.create({
    ...body,
    householdId: profile.householdId,
    createdById: profile.id,
    dueAt: body.dueAt ? new Date(body.dueAt) : null,
  })
  return NextResponse.json({ task }, { status: 201 })
}
