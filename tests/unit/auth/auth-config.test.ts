import { describe, it, expect } from 'vitest'
import { authConfig } from '@/auth.config'

type AuthorizedParams = Parameters<
  NonNullable<NonNullable<typeof authConfig.callbacks>['authorized']>
>[0]

function makeParams(isLoggedIn: boolean, pathname: string, search = ''): AuthorizedParams {
  const url = new URL(`http://localhost${pathname}${search}`)
  return {
    auth: isLoggedIn ? ({ user: { id: 'u1', email: 'test@test.com' } } as any) : null,
    request: { nextUrl: url } as any,
  }
}

const authorized = authConfig.callbacks!.authorized!.bind(authConfig.callbacks)

describe('authConfig.callbacks.authorized', () => {
  describe('unauthenticated user', () => {
    it('allows access to /login', async () => {
      const result = await authorized(makeParams(false, '/login'))
      expect(result).toBe(true)
    })

    it('allows access to /signup', async () => {
      const result = await authorized(makeParams(false, '/signup'))
      expect(result).toBe(true)
    })

    it('allows access to /invite', async () => {
      const result = await authorized(makeParams(false, '/invite'))
      expect(result).toBe(true)
    })

    it('allows access to /signup?step=household (household setup)', async () => {
      const result = await authorized(makeParams(false, '/signup', '?step=household'))
      expect(result).toBe(true)
    })

    it('blocks access to /dashboard', async () => {
      const result = await authorized(makeParams(false, '/dashboard'))
      expect(result).toBe(false)
    })

    it('blocks access to /quests', async () => {
      const result = await authorized(makeParams(false, '/quests'))
      expect(result).toBe(false)
    })
  })

  describe('authenticated user', () => {
    it('redirects away from /login to /dashboard', async () => {
      const result = await authorized(makeParams(true, '/login'))
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).headers.get('location')).toBe('http://localhost/dashboard')
    })

    it('redirects away from /signup to /dashboard', async () => {
      const result = await authorized(makeParams(true, '/signup'))
      expect(result).toBeInstanceOf(Response)
      expect((result as Response).headers.get('location')).toContain('/dashboard')
    })

    it('allows access to /signup?step=household (no redirect loop)', async () => {
      const result = await authorized(makeParams(true, '/signup', '?step=household'))
      expect(result).toBe(true)
    })

    it('allows access to /invite', async () => {
      const result = await authorized(makeParams(true, '/invite'))
      // Authenticated users can still accept invites
      expect(result).not.toBe(false)
    })

    it('allows access to /dashboard', async () => {
      const result = await authorized(makeParams(true, '/dashboard'))
      expect(result).toBe(true)
    })

    it('allows access to /quests', async () => {
      const result = await authorized(makeParams(true, '/quests'))
      expect(result).toBe(true)
    })
  })
})
