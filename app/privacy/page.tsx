import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Daily Quest',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh bg-bg text-fg flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="font-quest font-semibold text-lg text-gold hover:text-gold-bright transition-colors">
          ← Daily Quest
        </Link>
      </header>

      <main className="flex-1 px-6 py-12 max-w-2xl mx-auto w-full">
        <h1 className="font-quest text-3xl font-bold text-fg mb-2">Privacy Policy</h1>
        <p className="text-fg-subtle text-sm mb-10">Last updated: June 2026</p>

        <div className="space-y-8 text-fg-muted leading-relaxed">
          <section>
            <h2 className="font-quest text-lg font-semibold text-fg mb-3">What we collect</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <strong className="text-fg">Email address</strong> — used to create and identify
                your account.
              </li>
              <li>
                <strong className="text-fg">Name / display name</strong> — shown to your household
                party members.
              </li>
              <li>
                <strong className="text-fg">Google OAuth tokens</strong> — only if you sign in with
                Google; used solely for authentication.
              </li>
              <li>
                <strong className="text-fg">App usage data</strong> — tasks, rewards, and household
                data you create inside the app.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-quest text-lg font-semibold text-fg mb-3">How we use it</h2>
            <p className="text-sm">
              Your data is used exclusively to operate Daily Quest — authenticating you, displaying
              your household's quests and rewards, and sending push notifications if you enable
              them. Nothing else.
            </p>
          </section>

          <section>
            <h2 className="font-quest text-lg font-semibold text-fg mb-3">What we never do</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>We do not sell your data to anyone.</li>
              <li>We do not share your data with third parties for advertising.</li>
              <li>We do not use your data to train AI models.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-quest text-lg font-semibold text-fg mb-3">Cookies & storage</h2>
            <p className="text-sm">
              We use a single session cookie to keep you logged in. No tracking cookies, no
              analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="font-quest text-lg font-semibold text-fg mb-3">Data retention</h2>
            <p className="text-sm">
              Your data is kept as long as your account exists. You can delete your account at any
              time from the settings page, which removes all associated data.
            </p>
          </section>

          <section>
            <h2 className="font-quest text-lg font-semibold text-fg mb-3">Contact</h2>
            <p className="text-sm">
              Questions? Reach out at{' '}
              <a
                href="mailto:johnnyvillegaslrs@gmail.com"
                className="text-gold hover:text-gold-bright underline underline-offset-2 transition-colors"
              >
                johnnyvillegaslrs@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-center text-sm text-fg-subtle">
        vibecoded with love by{' '}
        <a
          href="https://github.com/linkrs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold hover:text-gold-bright transition-colors underline underline-offset-2"
        >
          linkrs
        </a>
      </footer>
    </div>
  )
}
