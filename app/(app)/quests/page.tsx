import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { db } from '@/lib/db/implementation'
import { QuestsClient } from './quests-client'

export default async function QuestsPage() {
  const profile = await getProfile()
  if (!profile?.householdId) redirect('/login')

  const [tasks, categories, members] = await Promise.all([
    db.tasks.findByHousehold(profile.householdId),
    db.categories.findByHousehold(profile.householdId),
    db.profiles.findByHousehold(profile.householdId),
  ])

  return <QuestsClient profile={profile} initialTasks={tasks} categories={categories} members={members} />
}
