import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locale-context'
import type { Locale } from '@/lib/i18n/locale-context'

export async function PATCH(request: Request) {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const updates: Partial<{ displayName: string; avatarUrl: string; locale: string }> = {}

  if (typeof body.locale === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(body.locale)) {
    updates.locale = body.locale as Locale
  }
  if (typeof body.displayName === 'string') updates.displayName = body.displayName
  if (typeof body.avatarUrl === 'string') updates.avatarUrl = body.avatarUrl

  const updated = await db.profiles.update(profile.id, updates)
  return NextResponse.json({ profile: updated })
}
