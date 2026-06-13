'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/use-translation'

function InviteForm() {
  const { t } = useTranslation()
  const params = useSearchParams()
  const token = params.get('token')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [householdName, setHouseholdName] = useState('')

  useEffect(() => {
    if (token) {
      fetch(`/api/invite/validate?token=${token}`)
        .then((r) => r.json())
        .then((d) => { if (d.householdName) setHouseholdName(d.householdName) })
    }
  }, [token])

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setLoading(true)
    setError('')

    const reg = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    if (!reg.ok) { const d = await reg.json(); setError(d.error ?? t('auth.signupFailed')); setLoading(false); return }

    await signIn('credentials', { email, password, redirect: false })

    const accept = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (!accept.ok) { setError(t('auth.joinHouseholdFailed')); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  return (
    <Card>
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🏰</div>
        <h2 className="font-quest text-xl font-bold text-fg">{t('auth.youreInvited')}</h2>
        {householdName && (
          <p className="text-fg-muted text-sm mt-1">
            {t('auth.joinHousehold', { name: householdName })}
          </p>
        )}
      </div>
      <form onSubmit={handleAccept} className="space-y-4">
        <Input label={t('auth.yourName')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.heroNamePlaceholder')} required />
        <Input label={t('auth.emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} required />
        <Input label={t('auth.passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} minLength={6} required />
        {error && <p className="text-sm text-ruby">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.joinHouseholdBtn')}</Button>
      </form>
    </Card>
  )
}

function LoadingFallback() {
  const { t } = useTranslation()
  return <div className="text-center text-fg-muted">{t('common.loading')}</div>
}

export default function InvitePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <InviteForm />
    </Suspense>
  )
}
