import { NextResponse } from 'next/server'
import { getProfile } from '@/lib/auth/get-profile'
import { rewardsService } from '@/lib/services/rewards.service'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import { AppError } from '@/lib/errors'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile()
  if (!profile?.householdId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = enforceRateLimit(request, 'REWARD_CLAIM')
  if (limited) return limited
  const { id } = await params
  try {
    const claim = await rewardsService.claim(id, profile.id, profile.householdId)
    return NextResponse.json({ claim })
  } catch (e: unknown) {
    // Only surface intentional, client-safe business errors. Anything else
    // (DB/runtime errors) is logged server-side and returned as a generic 500.
    if (e instanceof AppError) {
      return NextResponse.json({ error: e.message }, { status: e.status })
    }
    console.error('Reward claim failed:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
