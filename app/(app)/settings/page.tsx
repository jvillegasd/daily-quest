import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const profile = await db.profiles.findByUserId(user.id)
  if (!profile) redirect('/login')
  const prefs = await db.notifications.findByProfile(profile.id)
  return <SettingsClient profile={profile} notificationPrefs={prefs} />
}
