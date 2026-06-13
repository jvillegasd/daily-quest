import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { tasksService } from '@/lib/services/tasks.service'
import { db } from '@/lib/db/implementation'
import { TASK_ACTION } from '@/lib/types'

async function authorize(taskId: string, householdId: string) {
  const task = await db.tasks.findById(taskId)
  if (!task) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (task.householdId !== householdId) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { task }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await authorize(id, profile.householdId)
  if (error) return error
  const body = await request.json()
  if (body.action === TASK_ACTION.COMPLETE) return NextResponse.json({ task: await tasksService.complete(id, profile.id) })
  if (body.action === TASK_ACTION.SKIP) return NextResponse.json({ task: await tasksService.skip(id) })
  return NextResponse.json({ task: await tasksService.update(id, body) })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await authorize(id, profile.householdId)
  if (error) return error
  await tasksService.delete(id)
  return NextResponse.json({ ok: true })
}
