import type { NextRequest } from 'next/server'
import { handlers } from '@/auth'
import { enforceRateLimit } from '@/lib/security/rate-limit'

export const { GET } = handlers

// Rate-limit credential sign-in attempts (brute-force protection). Other
// NextAuth POST endpoints (OAuth callbacks, csrf, signout) pass through.
export async function POST(request: NextRequest) {
  if (request.nextUrl.pathname.endsWith('/callback/credentials')) {
    const limited = enforceRateLimit(request, 'LOGIN')
    if (limited) return limited
  }
  return handlers.POST(request)
}
