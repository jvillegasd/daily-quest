import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const origin = url.origin

  if (code) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.exchangeCodeForSession(code)

    if (user) {
      let profile = await db.profiles.findByUserId(user.id)
      if (!profile) {
        profile = await db.profiles.create({
          userId: user.id,
          email: user.email!,
          displayName: user.user_metadata?.full_name ?? user.email!.split('@')[0],
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        })
      }
      if (!profile.householdId) {
        return NextResponse.redirect(`${origin}/signup?step=household`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/dashboard`)
}
