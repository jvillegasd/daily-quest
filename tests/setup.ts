import '@testing-library/jest-dom'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
  headers: vi.fn(() => new Headers()),
}))

vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => { vi.clearAllMocks() })
afterAll(() => { vi.restoreAllMocks() })
