'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/lib/i18n/use-translation'

function SignupForm() {
  const { t } = useTranslation()
  const params = useSearchParams()
  const step = params.get('step')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    if (!res.ok) { const d = await res.json(); setError(d.error ?? t('auth.signupFailed')); setLoading(false); return }
    await signIn('credentials', { email, password, redirect: false })
    window.location.href = '/signup?step=household'
  }

  async function handleCreateHousehold(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/households', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: householdName }),
    })
    if (!res.ok) { setError(t('auth.householdFailed')); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  if (step === 'household') {
    return (
      <Card>
        <h2 className="font-quest text-xl font-bold text-fg mb-2 text-center">{t('auth.nameHousehold')}</h2>
        <p className="text-fg-muted text-sm text-center mb-6">{t('auth.householdSubtitle')}</p>
        <form onSubmit={handleCreateHousehold} className="space-y-4">
          <Input label={t('auth.householdNameLabel')} value={householdName} onChange={(e) => setHouseholdName(e.target.value)} placeholder={t('auth.householdNamePlaceholder')} required />
          {error && <p className="text-sm text-ruby">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.establishHousehold')}</Button>
        </form>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="font-quest text-xl font-bold text-fg mb-6 text-center">{t('auth.joinAdventure')}</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <Input label={t('auth.yourName')} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('auth.heroNamePlaceholder')} required />
        <Input label={t('auth.emailLabel')} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} required />
        <Input label={t('auth.passwordLabel')} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} minLength={6} required />
        {error && <p className="text-sm text-ruby">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>{t('auth.createAccount')}</Button>
      </form>
      <p className="text-center text-sm text-fg-muted mt-4">
        {t('auth.alreadyHero')}{' '}
        <Link href="/login" className="text-gold hover:text-gold-bright font-semibold">{t('auth.signIn')}</Link>
      </p>
    </Card>
  )
}

function LoadingFallback() {
  const { t } = useTranslation()
  return <div className="text-center text-fg-muted">{t('common.loading')}</div>
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupForm />
    </Suspense>
  )
}
