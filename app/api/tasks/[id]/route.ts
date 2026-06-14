import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { tasksService } from '@/lib/services/tasks.service'
import { db } from '@/lib/db/implementation'
import { TASK_ACTION, POINTS_TYPE } from '@/lib/types'
import { parseBody, TaskPatchSchema } from '@/lib/validation/schemas'

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
  const { error, task: existing } = await authorize(id, profile.householdId)
  if (error) return error
  const parsed = await parseBody(request, TaskPatchSchema)
  if (!parsed.ok) return parsed.response
  const { action, dueAt, ...rest } = parsed.data
  if (action === TASK_ACTION.COMPLETE) {
    if (existing!.pointsType === POINTS_TYPE.PERSONAL && existing!.assignedToId && existing!.assignedToId !== profile.id) {
      return NextResponse.json({ error: 'Only the assigned member can complete this quest' }, { status: 403 })
    }
    const { task, levelUp } = await tasksService.complete(id, profile.id)
    return NextResponse.json({ task, levelUp })
  }
  if (action === TASK_ACTION.SKIP) return NextResponse.json({ task: await tasksService.skip(id) })
  const updates = { ...rest, ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}) }
  return NextResponse.json({ task: await tasksService.update(id, updates) })
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
