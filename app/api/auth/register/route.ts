import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { email, password, name } = await request.json()
  if (!email || !password || !name) return NextResponse.json({ error: 'All fields required' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })

  if (existing) {
    // Email exists — allow only if it's a Google-only user adding a password for the first time
    const credAccount = await prisma.account.findFirst({
      where: { userId: existing.id, provider: 'credentials' },
    })
    if (credAccount) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    const hash = await bcrypt.hash(password, 12)
    await prisma.account.create({
      data: { userId: existing.id, type: 'credentials', provider: 'credentials', providerAccountId: email, passwordHash: hash },
    })
    return NextResponse.json({ ok: true }, { status: 200 })
  }

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
