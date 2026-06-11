'use client'

import { getLevelName } from '@/lib/types'
import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  displayName: string
  avatarUrl?: string | null
  level: number
  personalPoints: number
  size?: 'sm' | 'md' | 'lg'
  showLevel?: boolean
}

const levelColors: Record<number, string> = {
  1: '#a08858',
  5: '#c9a84c',
  10: '#e6b84a',
  20: '#60a5fa',
  30: '#a855f7',
  40: '#ef4444',
  50: '#f0cc70',
}

function getLevelColor(level: number): string {
  const keys = Object.keys(levelColors).map(Number).sort((a, b) => b - a)
  for (const k of keys) {
    if (level >= k) return levelColors[k]
  }
  return levelColors[1]
}

export function Avatar({ displayName, avatarUrl, level, size = 'md', showLevel = true }: AvatarProps) {
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const sizeMap = {
    sm: { outer: 'h-8 w-8', text: 'text-xs', badge: 'h-4 w-4 text-[9px] -bottom-0.5 -right-0.5' },
    md: { outer: 'h-10 w-10', text: 'text-sm', badge: 'h-5 w-5 text-[10px] -bottom-1 -right-1' },
    lg: { outer: 'h-16 w-16', text: 'text-xl', badge: 'h-7 w-7 text-xs -bottom-1 -right-1' },
  }

  const s = sizeMap[size]
  const color = getLevelColor(level)

  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-quest font-bold text-bg select-none',
          s.outer, s.text
        )}
        style={{ background: `linear-gradient(135deg, ${color}, ${color}88)`, boxShadow: `0 0 12px ${color}55` }}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="rounded-full w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {showLevel && (
        <div
          className={cn(
            'absolute rounded-full flex items-center justify-center font-quest font-bold text-bg border-2 border-bg',
            s.badge
          )}
          style={{ background: color }}
        >
          {level}
        </div>
      )}
    </div>
  )
}

export function LevelBadge({ level }: { level: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-quest font-semibold"
      style={{ color: getLevelColor(level) }}
    >
      ⚔️ {getLevelName(level)}
    </span>
  )
}
