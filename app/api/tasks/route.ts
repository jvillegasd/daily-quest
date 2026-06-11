import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { tasksService } from '@/lib/services/tasks.service'

export async function GET() {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tasks = await tasksService.getByHousehold(profile.householdId)
  return NextResponse.json({ tasks })
}

export async function POST(request: Request) {
  const profile = await getProfile()
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
