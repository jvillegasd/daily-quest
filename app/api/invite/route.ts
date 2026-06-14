import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { Resend } from 'resend'
import { ROLE } from '@/lib/types'
import { parseBody, InviteSchema } from '@/lib/validation/schemas'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { escapeHtml } from '@/lib/security/escape'

export async function POST(request: Request) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Only household admins may invite — prevents any member from blasting invites.
  if (profile.role !== ROLE.ADMIN) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const limited = enforceRateLimit(request, 'INVITE_SEND')
  if (limited) return limited

  const parsed = await parseBody(request, InviteSchema)
  if (!parsed.ok) return parsed.response
  const { email } = parsed.data

  const household = await db.households.findById(profile.householdId)
  if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

  // Escape user-controlled values before interpolating into the email HTML.
  const inviterName = escapeHtml(profile.displayName)
  const householdName = escapeHtml(household.name)
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite?token=${household.inviteCode}`

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: `${profile.displayName} invites you to Daily Quest`,
    html: `<h2>⚔️ You've been invited!</h2><p><strong>${inviterName}</strong> invited you to join <strong>${householdName}</strong>.</p><a href="${inviteUrl}" style="background:#c9a84c;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Accept Invitation</a>`,
  })
  return NextResponse.json({ ok: true })
}
