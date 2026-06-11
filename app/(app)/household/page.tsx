import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { redirect } from 'next/navigation'
import { HouseholdClient } from './household-client'

export default async function HouseholdPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.profiles.findByUserId(user.id)
  if (!profile?.householdId) redirect('/login')

  const [household, members, categories] = await Promise.all([
    db.households.findById(profile.householdId),
    db.profiles.findByHousehold(profile.householdId),
    db.categories.findByHousehold(profile.householdId),
  ])

  return (
    <HouseholdClient
      profile={profile}
      household={household!}
      members={members}
      categories={categories}
    />
  )
}
