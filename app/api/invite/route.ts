import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { email } = await request.json()
  const household = await db.households.findById(profile.householdId)
  if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${household.inviteCode}`
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: `${profile.displayName} invites you to Daily Quest`,
    html: `<h2>⚔️ You've been invited!</h2><p><strong>${profile.displayName}</strong> invited you to join <strong>${household.name}</strong>.</p><a href="${inviteUrl}" style="background:#c9a84c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Accept Invitation</a>`,
  })
  return NextResponse.json({ ok: true })
}
