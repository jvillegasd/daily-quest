'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'
import { LocaleProvider } from '@/lib/i18n/locale-context'
import { LevelUpProvider } from '@/components/level-up-toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <LocaleProvider>
          <LevelUpProvider>
            {children}
          </LevelUpProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}
