'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

function SignupForm() {
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
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    })
    if (error) { setError(error.message); setLoading(false); return }
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
    if (!res.ok) { setError('Failed to create household'); setLoading(false); return }
    window.location.href = '/dashboard'
  }

  if (step === 'household') {
    return (
      <Card>
        <h2 className="font-quest text-xl font-bold text-fg mb-2 text-center">Name Your Household</h2>
        <p className="text-fg-muted text-sm text-center mb-6">This is your party&apos;s home base</p>
        <form onSubmit={handleCreateHousehold} className="space-y-4">
          <Input
            label="Household Name"
            value={householdName}
            onChange={(e) => setHouseholdName(e.target.value)}
            placeholder="The Brave House of ..."
            required
          />
          {error && <p className="text-sm text-ruby">{error}</p>}
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            ⚔️ Establish Household
          </Button>
        </form>
      </Card>
    )
  }

  return (
    <Card>
      <h2 className="font-quest text-xl font-bold text-fg mb-6 text-center">Join the Adventure</h2>
      <form onSubmit={handleSignup} className="space-y-4">
        <Input
          label="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Hero Name"
          required
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hero@realm.com"
          required
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          required
        />
        {error && <p className="text-sm text-ruby">{error}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          Create Account
        </Button>
      </form>
      <p className="text-center text-sm text-fg-muted mt-4">
        Already a hero?{' '}
        <Link href="/login" className="text-gold hover:text-gold-bright font-semibold">
          Sign in
        </Link>
      </p>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-center text-fg-muted">Loading...</div>}>
      <SignupForm />
    </Suspense>
  )
}
