import Image from 'next/image'
import Link from 'next/link'
import { Scroll, Users, Trophy, Bell, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Scroll,
    title: 'Daily Quests',
    description:
      'Turn mundane chores into epic quests. Assign, track, and complete tasks with your household party.',
  },
  {
    icon: Users,
    title: 'Your Party',
    description:
      'Invite household members to your kingdom. Everyone sees the quest log and contributes to your shared adventure.',
  },
  {
    icon: Trophy,
    title: 'Earn Rewards',
    description:
      'Complete quests to earn XP and level up. Redeem rewards your household sets — a treat for your efforts.',
  },
  {
    icon: Bell,
    title: 'Daily Reminders',
    description:
      'Push notifications keep every adventurer on track. No quest gets forgotten, no chore left undone.',
  },
]

export function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-bg text-fg">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Image src="/sword.svg" alt="Daily Quest" width={24} height={24} className="opacity-80" />
          <span className="font-quest font-semibold text-lg text-gold">Daily Quest</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-fg-muted hover:text-fg transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-gold text-[#1a1507] font-semibold px-4 py-1.5 rounded-lg hover:bg-gold-bright transition-colors"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="flex flex-col items-center text-center px-6 pt-20 pb-16 gap-6">
          <div className="p-4 rounded-2xl bg-bg-card border border-border-strong shadow-[var(--shadow-gold)] mb-2">
            <Image src="/sword.svg" alt="" width={48} height={48} />
          </div>

          <h1 className="font-quest text-4xl sm:text-5xl md:text-6xl font-bold shimmer leading-tight max-w-2xl">
            Daily Quest
          </h1>

          <p className="text-lg sm:text-xl text-fg-muted max-w-xl leading-relaxed">
            Turn your household chores into an epic adventure. Assign quests, earn rewards, and
            level up together with your party.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gold text-[#1a1507] font-bold px-8 py-3 rounded-xl hover:bg-gold-bright transition-colors shadow-[var(--shadow-gold)] text-base font-quest"
            >
              <Sparkles size={18} />
              Begin Your Adventure
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl border border-border-strong text-fg-muted hover:text-fg hover:border-gold transition-colors text-base"
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* Features / About */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <h2 className="font-quest text-2xl sm:text-3xl font-semibold text-center text-fg mb-2">
            Your Kingdom Awaits
          </h2>
          <p className="text-center text-fg-muted mb-12 max-w-lg mx-auto">
            Everything your household needs to stay on top of daily tasks — wrapped in a world of
            adventure.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="card-parchment p-6 flex gap-4">
                <div className="shrink-0 w-11 h-11 rounded-xl bg-bg-elevated border border-border-strong flex items-center justify-center shadow-[var(--shadow-sm)]">
                  <Icon size={22} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-quest font-semibold text-fg mb-1">{title}</h3>
                  <p className="text-fg-muted text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Free to Use */}
        <section className="px-6 py-14 bg-bg-card border-y border-border">
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
            <span className="text-xs font-quest uppercase tracking-widest text-gold-dim border border-border-strong rounded-full px-4 py-1">
              Always Free
            </span>
            <h2 className="font-quest text-2xl sm:text-3xl font-bold text-fg">
              No subscriptions. No limits.
            </h2>
            <p className="text-fg-muted leading-relaxed max-w-md">
              Daily Quest is completely free to use. Create your household, invite your party, and
              start your adventure — no credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-2 inline-flex items-center gap-2 bg-gold text-[#1a1507] font-bold px-8 py-3 rounded-xl hover:bg-gold-bright transition-colors shadow-[var(--shadow-gold)] font-quest"
            >
              <Sparkles size={18} />
              Start for Free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-fg-subtle">
        <span>
          vibecoded with ❤️ by{' '}
          <a
            href="https://github.com/jvillegasd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:text-gold-bright transition-colors underline underline-offset-2"
          >
            @jvillegasd
          </a>
        </span>
        <Link href="/privacy" className="hover:text-fg-muted transition-colors">
          Privacy Policy
        </Link>
      </footer>
    </div>
  )
}
