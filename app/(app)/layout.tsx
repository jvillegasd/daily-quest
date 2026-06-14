import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/auth/get-profile'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'
import { NotificationBell } from '@/components/layout/notification-bell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  if (!profile.householdId) redirect('/signup?step=household')

  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar profile={profile} />
      </div>
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <div className="fixed right-3 top-3 z-50">
        <NotificationBell />
      </div>
      <MobileNav />
    </div>
  )
}
