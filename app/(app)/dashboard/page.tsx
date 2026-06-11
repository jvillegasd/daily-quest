import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.profiles.findByUserId(user.id)
  if (!profile?.householdId) redirect('/login')

  const [tasks, rewards, members, household] = await Promise.all([
    db.tasks.findByHousehold(profile.householdId),
    db.rewards.findByHousehold(profile.householdId),
    db.profiles.findByHousehold(profile.householdId),
    db.households.findById(profile.householdId),
  ])

  return (
    <DashboardClient
      profile={profile}
      tasks={tasks}
      rewards={rewards}
      members={members}
      household={household!}
    />
  )
}
