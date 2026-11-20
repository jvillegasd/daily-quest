import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import {
  createLinkIntent,
  linkIntentSecret,
  LINK_INTENT_COOKIE,
  LINK_INTENT_TTL_MS,
} from '@/lib/auth/oauth-linking'

// Records that the signed-in user wants to link Google. The Google sign-in
// callback only attaches a Google identity to an existing user that holds a
// valid intent for itself (see decideOAuthSignIn).
export async function POST() {
  const profile = await getProfile()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const secret = linkIntentSecret()
  if (!secret) {
    console.error('Link Google: AUTH_SECRET / NEXTAUTH_SECRET is not set')
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(LINK_INTENT_COOKIE, createLinkIntent(profile.userId, Date.now(), secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth/callback',
    maxAge: LINK_INTENT_TTL_MS / 1000,
  })
  return res
}
