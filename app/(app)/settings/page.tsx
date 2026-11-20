import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { prisma } from '@/lib/db/prisma'
import { AUTH_ERROR } from '@/lib/constants'
import { SettingsClient } from './settings-client'

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  const [prefs, googleAccount, { error }] = await Promise.all([
    db.notifications.findByProfile(profile.id),
    prisma.account.findFirst({ where: { userId: profile.userId, provider: 'google' }, select: { id: true } }),
    searchParams,
  ])
  return (
    <SettingsClient
      profile={profile}
      notificationPrefs={prefs}
      googleLinked={googleAccount !== null}
      linkMismatch={error === AUTH_ERROR.LINK_MISMATCH}
    />
  )
}
