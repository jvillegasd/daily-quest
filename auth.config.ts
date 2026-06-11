import type { NextAuthConfig } from 'next-auth'

// Edge-safe config — no Node.js-only imports (no Prisma, no pg, no bcrypt)
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isSignupHousehold = nextUrl.pathname === '/signup' && nextUrl.searchParams.get('step') === 'household'
      const isAuthPath =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/signup') ||
        nextUrl.pathname.startsWith('/invite')

      // Let logged-in users access the household setup step
      if (isSignupHousehold) return true

      if (isAuthPath) {
        if (isLoggedIn) return Response.redirect(new URL('/dashboard', nextUrl))
        return true
      }
      return isLoggedIn
    },
  },
  providers: [],
}
