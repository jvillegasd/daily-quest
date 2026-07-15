import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { tasksService } from '@/lib/services/tasks.service'
import { db } from '@/lib/db/implementation'
import { ROLE, TASK_ACTION, POINTS_TYPE, TASK_TYPE } from '@/lib/types'
import { parseBody, TaskPatchSchema } from '@/lib/validation/schemas'
import { parseSupportedRecurrenceRule } from '@/lib/utils/recurrence'
import { isValidRecurrenceRule } from '@/lib/server/recurrence'
import { AppError } from '@/lib/errors'

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
    try {
      const { task, levelUp } = await tasksService.complete(id, profile.id)
      return NextResponse.json({ task, levelUp })
    } catch (error) {
      if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status })
      throw error
    }
  }
  if (action === TASK_ACTION.SKIP) {
    try {
      return NextResponse.json({ task: await tasksService.skip(id) })
    } catch (error) {
      if (error instanceof AppError) return NextResponse.json({ error: error.message }, { status: error.status })
      throw error
    }
  }
  if (profile.role !== ROLE.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const nextType = rest.type ?? existing!.type
  const suppliedRule = rest.recurrenceRule
  let recurrenceRule = suppliedRule === undefined ? existing!.recurrenceRule : suppliedRule
  if (nextType === TASK_TYPE.ONE_OFF) recurrenceRule = null
  if (nextType === TASK_TYPE.RECURRING) {
    const replacingRule = suppliedRule !== undefined && suppliedRule !== existing!.recurrenceRule
    if (!isValidRecurrenceRule(recurrenceRule ?? '') || (replacingRule && !parseSupportedRecurrenceRule(recurrenceRule ?? ''))) {
      return NextResponse.json({ error: 'Choose a valid recurrence schedule' }, { status: 400 })
    }
  }
  const updates = {
    ...rest,
    recurrenceRule,
    ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
  }
  return NextResponse.json({ task: await tasksService.update(id, updates) })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (profile.role !== ROLE.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { error } = await authorize(id, profile.householdId)
  if (error) return error
  await tasksService.delete(id)
  return NextResponse.json({ ok: true })
}
