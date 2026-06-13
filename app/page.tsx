import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { LandingPage } from './landing-page'

export default async function Home() {
  const profile = await getProfile()
  if (profile) redirect('/dashboard')
  return <LandingPage />
}
