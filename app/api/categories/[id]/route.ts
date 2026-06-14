import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { parseBody, CategoryPatchSchema } from '@/lib/validation/schemas'

async function authorize(categoryId: string, householdId: string) {
  const category = await db.categories.findById(categoryId)
  if (!category) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (category.householdId !== householdId) return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  return { category }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await authorize(id, profile.householdId)
  if (error) return error
  await db.categories.delete(id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const { error } = await authorize(id, profile.householdId)
  if (error) return error
  const parsed = await parseBody(request, CategoryPatchSchema)
  if (!parsed.ok) return parsed.response
  const category = await db.categories.update(id, parsed.data)
  return NextResponse.json({ category })
}
