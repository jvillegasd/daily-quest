import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { HouseholdClient } from './household-client'

export default async function HouseholdPage() {
  const profile = await getProfile()
  if (!profile?.householdId) redirect('/login')

  const [household, members, categories] = await Promise.all([
    db.households.findById(profile.householdId),
    db.profiles.findByHousehold(profile.householdId),
    db.categories.findByHousehold(profile.householdId),
  ])

  return <HouseholdClient profile={profile} household={household!} members={members} categories={categories} />
}
