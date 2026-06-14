'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTranslation } from '@/lib/i18n/use-translation'
import { API } from '@/lib/constants'
import type { NotificationEvent } from '@/lib/types'

const POLL_MS = 60_000

// Dates arrive as ISO strings over JSON.
interface FeedItem {
  id: string
  type: NotificationEvent
  title: string
  body: string
  linkUrl: string | null
  readAt: string | null
  createdAt: string
}

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  return `${Math.floor(hr / 24)}d`
}

export function NotificationBell() {
  const router = useRouter()
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<FeedItem[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const refetch = useCallback(async () => {
    try {
      const res = await fetch(API.NOTIFICATIONS)
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items)
      setUnread(data.unread)
    } catch {}
  }, [])

  // Poll every 60s, plus on mount. refetch() syncs with an external system (the
  // API); its setState runs async in the fetch callback, not synchronously here.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refetch()
    const id = setInterval(refetch, POLL_MS)
    return () => clearInterval(id)
  }, [refetch])

  // Close when clicking outside.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) refetch()
  }

  async function markAllRead() {
    setUnread(0)
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })))
    await fetch(API.NOTIFICATIONS_READ, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => {})
  }

  function openItem(item: FeedItem) {
    setOpen(false)
    if (!item.readAt) {
      setUnread((u) => Math.max(0, u - 1))
      fetch(API.NOTIFICATIONS_READ, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [item.id] }),
      }).catch(() => {})
    }
    if (item.linkUrl) router.push(item.linkUrl)
  }

  const hasUnread = items.some((i) => !i.readAt)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-label={t('notifications.title')}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-card text-fg-muted shadow-sm hover:text-fg transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ruby px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-border bg-bg-card shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-bold text-fg">{t('notifications.title')}</span>
            {hasUnread && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-semibold text-gold hover:underline">
                <Check size={12} /> {t('notifications.markAllRead')}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-fg-muted">{t('notifications.empty')}</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => openItem(item)}
                  className={cn(
                    'flex w-full flex-col items-start gap-0.5 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-border/30',
                    !item.readAt && 'bg-gold/5'
                  )}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-fg">{item.title}</span>
                    <span className="shrink-0 text-[10px] text-fg-subtle">{timeAgo(item.createdAt)}</span>
                  </div>
                  <span className="text-xs text-fg-muted">{item.body}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
