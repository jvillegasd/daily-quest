'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { LocaleProvider } from '@/lib/i18n/locale-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <LocaleProvider>
          {children}
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
