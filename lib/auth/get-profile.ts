import { auth } from '@/auth'
import { db } from '@/lib/db/implementation'
import type { Profile } from '@/lib/types'

export async function getProfile(): Promise<Profile | null> {
  const session = await auth()
  if (!session?.user?.id) return null
  return db.profiles.findByUserId(session.user.id)
}
