import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/prisma'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import { cookies } from 'next/headers'
import { decideOAuthSignIn, linkIntentSecret, verifyLinkIntent, LINK_INTENT_COOKIE } from '@/lib/auth/oauth-linking'
import { AUTH_ERROR, ROUTES } from '@/lib/constants'

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
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      // Never attach an OAuth identity to an existing user by email alone: that
      // user may be a password account registered by someone else with this
      // email. Linking needs a link intent the signed-in user created in Settings.
      if (account && account.provider !== 'credentials') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: {
            id: true,
            accounts: {
              where: { provider: account.provider, providerAccountId: account.providerAccountId },
              select: { id: true },
            },
          },
        })

        // The intent is single-use: read it, then clear it whatever the outcome.
        const cookieStore = await cookies()
        const intentToken = cookieStore.get(LINK_INTENT_COOKIE)?.value
        if (intentToken) cookieStore.delete({ name: LINK_INTENT_COOKIE, path: '/api/auth/callback' })
        const secret = linkIntentSecret()
        const linkIntentUserId =
          account.provider === 'google' && secret ? verifyLinkIntent(intentToken, Date.now(), secret) : null

        const decision = decideOAuthSignIn({
          providerEmailVerified: profile?.email_verified === true,
          existingUserId: existingUser?.id ?? null,
          alreadyLinked: (existingUser?.accounts.length ?? 0) > 0,
          linkIntentUserId,
        })
        if (decision === 'unverified') return `${ROUTES.LOGIN}?error=${AUTH_ERROR.UNVERIFIED_EMAIL}`
        if (decision === 'not-linked') return `${ROUTES.LOGIN}?error=${AUTH_ERROR.LINK_REQUIRED}`
        if (decision === 'link-mismatch') return `${ROUTES.SETTINGS}?error=${AUTH_ERROR.LINK_MISMATCH}`
      }

      // Upsert user by email — preserves the existing DB id if the email already exists
      await prisma.user.upsert({
        where: { email: user.email },
        create: { id: user.id!, email: user.email, name: user.name, image: user.image },
        update: { name: user.name, image: user.image },
      })

      // Re-fetch to get the real DB id (may differ from the OAuth provider's user.id)
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
      if (!dbUser) return false

      // Create profile if not yet present, using the real DB user id
      const existingProfile = await prisma.profile.findUnique({ where: { userId: dbUser.id } })
      if (!existingProfile) {
        await prisma.profile.create({
          data: {
            userId: dbUser.id,
            email: user.email,
            displayName: user.name ?? user.email.split('@')[0],
            avatarUrl: user.image ?? null,
          },
        })
      }

      // For OAuth providers, ensure the account row is linked to the real DB user
      if (account && account.provider !== 'credentials') {
        const existingAccount = await prisma.account.findFirst({
          where: { provider: account.provider, providerAccountId: account.providerAccountId },
        })
        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              session_state: account.session_state as string | null,
            },
          })
        }
      }

      return true
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub
      return session
    },
    async jwt({ token, user }) {
      // On first sign-in, look up the real DB user id by email
      // so the token always carries the DB id regardless of provider
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
        if (dbUser) token.sub = dbUser.id
      }
      return token
    },
  },
  session: { strategy: 'jwt' },
})
