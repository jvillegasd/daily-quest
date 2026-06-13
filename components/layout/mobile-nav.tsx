'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scroll, Trophy, LayoutDashboard, Settings, Home } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTranslation } from '@/lib/i18n/use-translation'

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useTranslation()

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t('nav.kingdom') },
    { href: '/quests', icon: Scroll, label: t('nav.questLog') },
    { href: '/rewards', icon: Trophy, label: t('nav.treasure') },
    { href: '/household', icon: Home, label: t('nav.household') },
    { href: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-bg-card safe-area-bottom md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200',
                active ? 'text-gold' : 'text-fg-subtle hover:text-fg'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
