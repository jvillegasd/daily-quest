'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Scroll, Trophy, LayoutDashboard, Settings, Home } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Avatar, LevelBadge } from './avatar'
import { useTranslation } from '@/lib/i18n/use-translation'
import type { Profile } from '@/lib/types'

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
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
    <aside className="flex h-full flex-col border-r border-border bg-bg-card w-60 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <span className="text-2xl">⚔️</span>
        <span className="font-quest text-lg font-bold text-gold">Daily Quest</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                active
                  ? 'bg-gold/15 text-gold border border-gold/30'
                  : 'text-fg-muted hover:text-fg hover:bg-border/40 border border-transparent'
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl}
            level={profile.level}
            personalPoints={profile.personalPoints}
            size="sm"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-fg truncate">{profile.displayName}</p>
            <LevelBadge level={profile.level} />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
