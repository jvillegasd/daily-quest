import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const account = await prisma.account.findFirst({
          where: { provider: 'credentials', providerAccountId: credentials.email as string },
          include: { user: true },
        })
        if (!account?.passwordHash) return null
        const valid = await bcrypt.compare(credentials.password as string, account.passwordHash)
        if (!valid) return null
        return { id: account.user.id, email: account.user.email, name: account.user.name, image: account.user.image }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!user.email) return false
      await prisma.user.upsert({
        where: { email: user.email },
        create: { id: user.id!, email: user.email, name: user.name, image: user.image },
        update: { name: user.name, image: user.image },
      })
      const existing = await prisma.profile.findUnique({ where: { userId: user.id! } })
      if (!existing) {
        await prisma.profile.create({
          data: {
            userId: user.id!,
            email: user.email,
            displayName: user.name ?? user.email.split('@')[0],
            avatarUrl: user.image ?? null,
          },
        })
      }
      return true
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }) {
      if (user) token.sub = user.id
      return token
    },
  },
  session: { strategy: 'jwt' },
})
