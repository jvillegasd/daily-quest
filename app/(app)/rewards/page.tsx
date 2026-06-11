import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { redirect } from 'next/navigation'
import { RewardsClient } from './rewards-client'

export default async function RewardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.profiles.findByUserId(user.id)
  if (!profile?.householdId) redirect('/login')

  const [rewards, household] = await Promise.all([
    db.rewards.findByHousehold(profile.householdId),
    db.households.findById(profile.householdId),
  ])

  return <RewardsClient profile={profile} initialRewards={rewards} household={household!} />
}
