import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { RewardsClient } from './rewards-client'

export default async function RewardsPage() {
  const profile = await getProfile()
  if (!profile?.householdId) redirect('/login')

  const [rewards, household] = await Promise.all([
    db.rewards.findByHousehold(profile.householdId),
    db.households.findById(profile.householdId),
  ])

  return <RewardsClient profile={profile} initialRewards={rewards} household={household!} />
}
