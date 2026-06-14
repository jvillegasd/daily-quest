import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { tasksService } from '@/lib/services/tasks.service'
import { parseBody, TaskCreateSchema } from '@/lib/validation/schemas'

export async function GET() {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tasks = await tasksService.getByHousehold(profile.householdId)
  return NextResponse.json({ tasks })
}

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = await parseBody(request, TaskCreateSchema)
  if (!parsed.ok) return parsed.response
  const { dueAt, ...rest } = parsed.data
  const task = await tasksService.create({
    ...rest,
    householdId: profile.householdId,
    createdById: profile.id,
    dueAt: dueAt ? new Date(dueAt) : null,
  })
  return NextResponse.json({ task }, { status: 201 })
}
