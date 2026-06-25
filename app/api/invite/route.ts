import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { prisma } from '@/lib/db/prisma'
import { Resend } from 'resend'
import { ROLE } from '@/lib/types'
import { parseBody, InviteSchema } from '@/lib/validation/schemas'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { escapeHtml } from '@/lib/security/escape'
import { randomUUID } from 'crypto'

const INVITE_TTL_DAYS = 7

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

  const household = await prisma.household.findUnique({ where: { id: profile.householdId } })
  if (!household) return NextResponse.json({ error: 'Household not found' }, { status: 404 })

  // Escape user-controlled values before interpolating into the email HTML.
  const inviterName = escapeHtml(profile.displayName)
  const householdName = escapeHtml(household.name)
  const invitation = await prisma.invitation.create({
    data: {
      householdId: household.id,
      email,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  })
  const inviteUrl = new URL(
    `/invite?token=${invitation.token}`,
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || request.url,
  ).toString()
  const safeInviteUrl = escapeHtml(inviteUrl)
  const subject = `${profile.displayName} invites you to Daily Quest`
  const text = `${profile.displayName} invited you to join ${household.name} on Daily Quest. Accept within 7 days. This one-time link expires after use: ${inviteUrl}`
  const html = `
    <div style="margin:0;padding:32px 16px;background:#fdf6e3;font-family:Nunito,Arial,sans-serif;color:#3b2a14;">
      <div style="max-width:560px;margin:0 auto;background:#fff8e7;border:1px solid #e8d5a3;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px rgba(100,70,20,.16);">
        <div style="padding:28px 28px 20px;text-align:center;background:linear-gradient(135deg,#fff8e7,#f2dfaa);border-bottom:1px solid #e8d5a3;">
          <div style="font-size:44px;line-height:1;margin-bottom:10px;">⚔️</div>
          <p style="margin:0 0 8px;color:#7c6245;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Daily Quest</p>
          <h1 style="margin:0;color:#3b2a14;font-family:Georgia,serif;font-size:28px;line-height:1.2;">Your household adventure awaits</h1>
        </div>
        <div style="padding:28px;text-align:center;">
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#3b2a14;"><strong>${inviterName}</strong> invited you to join <strong>${householdName}</strong>.</p>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#7c6245;">Team up, complete quests, and earn rewards together.</p>
          <a href="${safeInviteUrl}" style="display:inline-block;background:#c9a84c;color:#1a1507;padding:14px 24px;border-radius:12px;text-decoration:none;font-weight:800;font-size:15px;box-shadow:0 4px 14px rgba(201,168,76,.35);">Accept invitation</a>
          <p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#a08858;">This one-time invite expires after 7 days or after it is used. You can join with Google or email after opening the link.</p>
        </div>
      </div>
    </div>
  `

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject,
    html,
    text,
  })
  if (error) {
    await prisma.invitation.delete({ where: { id: invitation.id } }).catch(() => null)
    return NextResponse.json({ error: error.message }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
