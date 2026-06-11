import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  const prefs = await db.notifications.findByProfile(profile.id)
  return <SettingsClient profile={profile} notificationPrefs={prefs} />
}
