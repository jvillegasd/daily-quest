'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

function InviteForm() {
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
    const supabase = createClient()
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    })

    if (signupError || !data.user) {
      setError(signupError?.message ?? 'Signup failed')
      setLoading(false)
      return
    }

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (!res.ok) { setError('Failed to join household'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  return (
    <Card>
      <div className="text-center mb-6">
        <div className="text-3xl mb-2">🏰</div>
        <h2 className="font-quest text-xl font-bold text-fg">You&apos;re Invited!</h2>
        {householdName && (
          <p className="text-fg-muted text-sm mt-1">Join <span className="text-gold font-semibold">{householdName}</span></p>
        )}
      </div>
      <form onSubmit={handleAccept} className="space-y-4">
        <Input label="Your Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hero Name" required />
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hero@realm.com" required />
        <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
        {error && <p className="text-sm text-ruby">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          🏰 Join the Household
        </Button>
      </form>
    </Card>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className="text-center text-fg-muted">Loading...</div>}>
      <InviteForm />
    </Suspense>
  )
}
