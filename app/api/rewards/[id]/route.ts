import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rewardsService } from '@/lib/services/rewards.service'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await request.json()
  const reward = await rewardsService.update(id, body)
  return NextResponse.json({ reward })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  await rewardsService.delete(id)
  return NextResponse.json({ ok: true })
}
