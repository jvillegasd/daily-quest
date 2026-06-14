'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, LogOut, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, LevelBadge } from '@/components/layout/avatar'
import { signOut } from 'next-auth/react'
import { useTranslation } from '@/lib/i18n/use-translation'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locale-context'
import type { Locale } from '@/lib/i18n/locale-context'
import type { Profile, NotificationPreference, NotificationEvent } from '@/lib/types'
import { API } from '@/lib/constants'
import { ROUTES } from '@/lib/constants'

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
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {}
    ALL_EVENTS.forEach((e) => {
      map[e] = notificationPrefs.find((p) => p.eventType === e)?.enabled ?? true
    })
    return map
  })
  useEffect(() => {
    // Hydration guard: defer theme/language cards to the client to avoid SSR mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  async function togglePref(event: NotificationEvent) {
    const enabled = !prefs[event]
    setPrefs((p) => ({ ...p, [event]: enabled }))
    await fetch(API.NOTIFICATIONS_PREFERENCES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: event, enabled }),
    })
  }

  async function handleLocaleChange(l: Locale) {
    setLocale(l)
    await fetch(API.PROFILE, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: l }),
    })
  }

  async function handleSignOut() {
    await signOut({ callbackUrl: ROUTES.LOGIN })
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    await fetch(API.PROFILE, { method: 'DELETE' })
    await signOut({ callbackUrl: ROUTES.LOGIN })
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
              { value: SUPPORTED_LOCALES[0], label: t('settings.languageEnglish'), flag: '🇬🇧' },
              { value: SUPPORTED_LOCALES[1], label: t('settings.languageSpanish'), flag: '🇪🇸' },
            ] as { value: Locale; label: string; flag: string }[]).map(({ value, label, flag }) => (
              <button
                key={value}
                onClick={() => handleLocaleChange(value)}
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

      {/* Notification preferences */}
      <Card>
        <CardHeader>
          <CardTitle>{t('settings.notificationsTitle')}</CardTitle>
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

      {/* Danger zone */}
      <Card className="border-ruby/40">
        <CardHeader>
          <CardTitle className="text-ruby">{t('settings.dangerZone')}</CardTitle>
        </CardHeader>
        <p className="text-sm text-fg-muted mb-4">
          {t('settings.deleteAccountDescription')}
        </p>
        {!deleteConfirm ? (
          <Button variant="danger" className="w-full" onClick={() => setDeleteConfirm(true)}>
            <Trash2 size={14} /> {t('settings.deleteAccount')}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ruby text-center">{t('settings.deleteConfirmTitle')}</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setDeleteConfirm(false)} disabled={deleting}>
                {t('settings.cancel')}
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? t('settings.deleting') : t('settings.deleteConfirmYes')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
