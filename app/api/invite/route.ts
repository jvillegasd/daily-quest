import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { Resend } from 'resend'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const profile = await db.profiles.findByUserId(user.id)
  if (!profile?.householdId) return NextResponse.json({ error: 'No household' }, { status: 400 })

  const { email } = await request.json()
  const household = await db.households.findById(profile.householdId)
  if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${household.inviteCode}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: `${profile.displayName} invites you to Daily Quest`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #c9a84c;">⚔️ You've been invited!</h1>
        <p><strong>${profile.displayName}</strong> has invited you to join <strong>${household.name}</strong> on Daily Quest.</p>
        <a href="${inviteUrl}" style="display: inline-block; background: #c9a84c; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px;">
          Accept Invitation
        </a>
        <p style="color: #888; font-size: 12px; margin-top: 24px;">Link expires when a new invite code is generated.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
