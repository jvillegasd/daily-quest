import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { tasksService } from '@/lib/services/tasks.service'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  if (body.action === 'complete') return NextResponse.json({ task: await tasksService.complete(id, profile.id) })
  if (body.action === 'skip') return NextResponse.json({ task: await tasksService.skip(id) })
  return NextResponse.json({ task: await tasksService.update(id, body) })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await tasksService.delete(id)
  return NextResponse.json({ ok: true })
}
