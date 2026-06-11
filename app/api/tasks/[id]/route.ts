import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { tasksService } from '@/lib/services/tasks.service'

async function getProfile(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return db.profiles.findByUserId(user.id)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  if (body.action === 'complete') {
    const task = await tasksService.complete(id, profile.id)
    return NextResponse.json({ task })
  }
  if (body.action === 'skip') {
    const task = await tasksService.skip(id)
    return NextResponse.json({ task })
  }

  const task = await tasksService.update(id, body)
  return NextResponse.json({ task })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const profile = await getProfile(supabase)
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await tasksService.delete(id)
  return NextResponse.json({ ok: true })
}
