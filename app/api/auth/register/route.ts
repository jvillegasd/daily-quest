import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { parseBody, RegisterSchema } from '@/lib/validation/schemas'
import { enforceRateLimit } from '@/lib/security/rate-limit'

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, 'REGISTER')
  if (limited) return limited

  const parsed = await parseBody(request, RegisterSchema)
  if (!parsed.ok) return parsed.response
  const { email, password, name } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })

  // Never attach a password to an existing user: this route is unauthenticated,
  // so doing so would let anyone take over an account by knowing its email.
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const hash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({ data: { email, name } })
  await prisma.account.create({
    data: { userId: user.id, type: 'credentials', provider: 'credentials', providerAccountId: email, passwordHash: hash },
  })
  await prisma.profile.create({
    data: { userId: user.id, email, displayName: name },
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
