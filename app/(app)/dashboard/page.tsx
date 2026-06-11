import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile?.householdId) redirect('/login')

  const [tasks, rewards, members, household] = await Promise.all([
    db.tasks.findByHousehold(profile.householdId),
    db.rewards.findByHousehold(profile.householdId),
    db.profiles.findByHousehold(profile.householdId),
    db.households.findById(profile.householdId),
  ])

  return <DashboardClient profile={profile} tasks={tasks} rewards={rewards} members={members} household={household!} />
}
