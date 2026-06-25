'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/use-translation'

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function InviteForm() {
  const { t } = useTranslation()
  const { status } = useSession()
  const params = useSearchParams()
  const token = params.get('token')
  const autoAccept = params.get('accept') === '1'
  const didAutoAccept = useRef(false)
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

  const acceptInvite = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    const accept = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (!accept.ok) { setError(t('auth.joinHouseholdFailed')); setLoading(false); return }
    window.location.href = '/dashboard'
  }, [token, t])

  useEffect(() => {
    if (status === 'authenticated' && autoAccept && !didAutoAccept.current) {
      didAutoAccept.current = true
      void acceptInvite()
    }
  }, [acceptInvite, autoAccept, status])

  async function handleGoogle() {
    if (!token) return
    setLoading(true)
    await signIn('google', { callbackUrl: `/invite?token=${encodeURIComponent(token)}&accept=1` })
  }

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
    await acceptInvite()
  }

  return (
    <Card className="p-6">
      <div className="text-center mb-6">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/15 text-3xl shadow-gold">🏰</div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-dim mb-2">Daily Quest</p>
        <h2 className="font-quest text-2xl font-bold text-fg text-balance">{t('auth.youreInvited')}</h2>
        {householdName && (
          <p className="text-fg-muted text-sm mt-2 text-pretty">
            {t('auth.joinHousehold', { name: householdName })}
          </p>
        )}
      </div>

      {status === 'authenticated' ? (
        <div className="space-y-4">
          <p className="text-center text-sm text-fg-muted text-pretty">{t('auth.inviteSignedInHint')}</p>
          {error && <p className="text-sm text-ruby">{error}</p>}
          <Button type="button" className="w-full" size="lg" loading={loading} onClick={acceptInvite}>{t('auth.joinHouseholdBtn')}</Button>
        </div>
      ) : (
        <>
          <Button type="button" variant="outline" className="w-full mb-4" onClick={handleGoogle} loading={loading}>
            <GoogleIcon />
            {t('auth.continueWithGoogle')}
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-fg-subtle">{t('common.or')}</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleAccept} className="space-y-4">
            <Input label={t('auth.yourName')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.heroNamePlaceholder')} required />
            <Input label={t('auth.emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} required />
            <Input label={t('auth.passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} minLength={8} required />
            <p className="text-xs leading-5 text-fg-subtle">{t('auth.inviteEmailHint')}</p>
            {error && <p className="text-sm text-ruby">{error}</p>}
            <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.joinHouseholdBtn')}</Button>
          </form>
        </>
      )}
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
