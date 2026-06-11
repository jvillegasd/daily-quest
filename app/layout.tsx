import type { Metadata, Viewport } from 'next'
import { Cinzel, Nunito } from 'next/font/google'
import { Providers } from '@/components/providers'
import { PWARegister } from '@/components/layout/pwa-register'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-cinzel',
  display: 'swap',
})

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Daily Quest',
  description: 'Gamified household task tracker for your party',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Daily Quest' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fdf6e3' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1507' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${cinzel.variable} ${nunito.variable} h-full`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="min-h-full antialiased font-body bg-bg text-fg">
        <Providers>
          <PWARegister />
          {children}
        </Providers>
      </body>
    </html>
  )
}
