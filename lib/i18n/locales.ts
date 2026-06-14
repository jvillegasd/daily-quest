// Server-safe locale constants. Kept out of locale-context.tsx (a 'use client'
// module) so server code — e.g. Zod validation schemas — can import the actual
// values rather than a client-reference proxy.
export type Locale = 'en' | 'es'
export const SUPPORTED_LOCALES = ['en', 'es'] as const satisfies readonly Locale[]
export const DEFAULT_LOCALE: Locale = 'en'
