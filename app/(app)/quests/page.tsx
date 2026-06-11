import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db/implementation'
import { redirect } from 'next/navigation'
import { QuestsClient } from './quests-client'

export default async function QuestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await db.profiles.findByUserId(user.id)
  if (!profile?.householdId) redirect('/login')

  const [tasks, categories, members] = await Promise.all([
    db.tasks.findByHousehold(profile.householdId),
    db.categories.findByHousehold(profile.householdId),
    db.profiles.findByHousehold(profile.householdId),
  ])

  return (
    <QuestsClient
      profile={profile}
      initialTasks={tasks}
      categories={categories}
      members={members}
    />
  )
}
