'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Bell, LogOut } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, LevelBadge } from '@/components/layout/avatar'
import { Badge } from '@/components/ui/badge'
import { signOut } from 'next-auth/react'
import { useTranslation } from '@/lib/i18n/use-translation'
import type { Profile, NotificationPreference, NotificationEvent } from '@/lib/types'

const ALL_EVENTS: NotificationEvent[] = [
  'TASK_PENDING', 'TASK_COMPLETED_BY_PARTNER', 'REWARD_CLAIMED',
  'TASK_ASSIGNED', 'POINTS_MILESTONE', 'DAILY_SUMMARY',
]

interface Props {
  profile: Profile
  notificationPrefs: NotificationPreference[]
}

export function SettingsClient({ profile, notificationPrefs }: Props) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale, t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    ALL_EVENTS.forEach((e) => {
      map[e] = notificationPrefs.find((p) => p.eventType === e)?.enabled ?? true
    })
    return map
  })
  useEffect(() => {
    setMounted(true)
    if ('Notification' in window) setPushEnabled(Notification.permission === 'granted')
  }, [])

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    })
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: sub.toJSON().keys }),
    })
    setPushEnabled(true)
  }

  async function togglePref(event: NotificationEvent) {
    const enabled = !prefs[event]
    setPrefs((p) => ({ ...p, [event]: enabled }))
    await fetch('/api/notifications/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: event, enabled }),
    })
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: '/login' })
  }

  const EVENT_LABELS: Record<NotificationEvent, string> = {
    TASK_PENDING: t('notifications.TASK_PENDING'),
    TASK_COMPLETED_BY_PARTNER: t('notifications.TASK_COMPLETED_BY_PARTNER'),
    REWARD_CLAIMED: t('notifications.REWARD_CLAIMED'),
    TASK_ASSIGNED: t('notifications.TASK_ASSIGNED'),
    POINTS_MILESTONE: t('notifications.POINTS_MILESTONE'),
    DAILY_SUMMARY: t('notifications.DAILY_SUMMARY'),
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto space-y-6">
      <h1 className="font-quest text-2xl font-bold text-fg">{t('settings.title')}</h1>

      {/* Profile card */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.yourCharacter')}</CardTitle>
          <LevelBadge level={profile.level} />
        </CardHeader>
        <div className="flex items-center gap-4">
          <Avatar
            displayName={profile.displayName}
            avatarUrl={profile.avatarUrl}
            level={profile.level}
            personalPoints={profile.personalPoints}
            size="lg"
          />
          <div>
            <p className="font-semibold text-fg text-lg">{profile.displayName}</p>
            <p className="text-fg-muted text-sm">{profile.email}</p>
            <p className="text-gold font-quest font-bold mt-1">{profile.personalPoints} {t('common.pts')}</p>
          </div>
        </div>
      </Card>

      {/* Theme */}
      {mounted && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.themeTitle')}</CardTitle>
          </CardHeader>
          <div className="flex gap-2">
            {([
              { value: 'light' as const, label: t('settings.themeLight'), icon: <Sun size={18} /> },
              { value: 'dark' as const, label: t('settings.themeDark'), icon: <Moon size={18} /> },
              { value: 'system' as const, label: t('settings.themeSystem'), icon: <span className="text-lg">💻</span> },
            ]).map(({ value, label, icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-semibold transition-all ${
                  theme === value ? 'bg-gold/15 border-gold text-gold' : 'border-border text-fg-muted hover:text-fg'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Language */}
      {mounted && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.languageTitle')}</CardTitle>
          </CardHeader>
          <div className="flex gap-2">
            {([
              { value: 'en' as const, label: t('settings.languageEnglish'), flag: '🇬🇧' },
              { value: 'es' as const, label: t('settings.languageSpanish'), flag: '🇪🇸' },
            ]).map(({ value, label, flag }) => (
              <button
                key={value}
                onClick={() => setLocale(value)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg border text-xs font-semibold transition-all ${
                  locale === value ? 'bg-gold/15 border-gold text-gold' : 'border-border text-fg-muted hover:text-fg'
                }`}
              >
                <span className="text-lg">{flag}</span>
                {label}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Push notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notificationsTitle')}</CardTitle>
          {pushEnabled ? (
            <Badge variant="emerald">{t('settings.pushEnabled')}</Badge>
          ) : (
            <Button size="sm" variant="sapphire" onClick={enablePush}>
              <Bell size={14} /> {t('settings.enablePush')}
            </Button>
          )}
        </CardHeader>
        <div className="space-y-2">
          {ALL_EVENTS.map((event) => (
            <label key={event} className="flex items-center justify-between p-3 rounded-lg bg-bg-elevated border border-border cursor-pointer hover:border-gold transition-colors">
              <span className="text-sm font-semibold text-fg">{EVENT_LABELS[event]}</span>
              <div
                onClick={() => togglePref(event)}
                className={`relative h-5 w-9 rounded-full transition-colors ${prefs[event] ? 'bg-gold' : 'bg-border'}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${prefs[event] ? 'left-4' : 'left-0.5'}`} />
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Sign out */}
      <Card>
        <Button variant="danger" className="w-full" onClick={handleSignOut}>
          <LogOut size={14} /> {t('settings.signOut')}
        </Button>
      </Card>
    </div>
  )
}
