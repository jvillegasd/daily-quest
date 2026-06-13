import type { NextAuthConfig } from 'next-auth'
import { ROUTES } from '@/lib/constants/routes'

// Edge-safe config — no Node.js-only imports (no Prisma, no pg, no bcrypt)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: ROUTES.LOGIN,
    error: ROUTES.LOGIN,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isSignupHousehold = nextUrl.pathname === ROUTES.SIGNUP && nextUrl.searchParams.get('step') === 'household'
      const isPublicPath =
        nextUrl.pathname === '/' ||
        nextUrl.pathname.startsWith('/privacy')

      const isAuthPath =
        nextUrl.pathname.startsWith(ROUTES.LOGIN) ||
        nextUrl.pathname.startsWith(ROUTES.SIGNUP) ||
        nextUrl.pathname.startsWith(ROUTES.INVITE)

      if (isPublicPath) return true

      // Let logged-in users access the household setup step
      if (isSignupHousehold) return true

      if (isAuthPath) {
        if (isLoggedIn) return Response.redirect(new URL(ROUTES.DASHBOARD, nextUrl))
        return true
      }
      return isLoggedIn
    },
  },
  providers: [],
}
