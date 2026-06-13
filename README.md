<div align="center">
  <img src="public/sword.svg" alt="Daily Quest" width="72" />

  <h1>Daily Quest</h1>

  <p><strong>Turn your household chores into an epic adventure.</strong><br/>
  Assign quests, earn rewards, and level up together with your party.</p>

  <p>
    <a href="https://daily-quest.jvillegasd.com">🌐 Live App</a> ·
    <a href="https://daily-quest.jvillegasd.com/privacy">Privacy Policy</a>
  </p>

  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/free-100%25-22c55e" alt="Free" />
</div>

---

## What is Daily Quest?

Daily Quest is a **gamified household task manager** built for roommates, couples, and families. Instead of a boring to-do list, your household becomes a party of adventurers — completing quests, earning XP, leveling up, and redeeming rewards together.

- **Free forever** — no subscriptions, no limits, no credit card required
- **Multi-user** — invite household members via shareable invite code
- **Gamified** — XP, levels, and a reward system keep everyone motivated
- **Push notifications** — daily reminders so no quest goes forgotten
- **Dark & light mode** — warm parchment RPG theme in both
- **Multilingual** — English and Spanish supported

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Auth | NextAuth v5 (Email + Google OAuth) |
| Animations | Framer Motion |
| Push Notifications | Web Push API |
| Email | Resend |
| Testing | Vitest + Playwright |

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or a [Supabase](https://supabase.com) project)

### Installation

```bash
git clone https://github.com/jvillegasd/daily-quest.git
cd daily-quest
npm install
```

### Environment Variables

Create a `.env` file at the root:

```env
DATABASE_URL=postgresql://...

NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

RESEND_API_KEY=...
```

### Database Setup

```bash
npx prisma migrate deploy
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the landing page. Create an account, name your household, and start questing.

---

## Features

### Quests
- Create one-off or recurring tasks with custom categories, points, and due dates
- Assign quests to specific party members or leave them open
- Track status: Pending, Done, Overdue

### Party (Household)
- Invite members via a shareable invite code
- Admin and Member roles
- Shared household XP alongside personal XP

### Rewards
- Create virtual or pledge-based rewards with custom costs
- Personal or shared point pools
- Cooldown timers to prevent spam-claiming

### Leveling
- XP thresholds increase with each level
- Level badge displayed throughout the app

### Notifications
- Push notifications for task reminders, completions, reward claims, and more
- Per-event granular controls in settings
- Daily digest option

---

## Project Structure

```
app/
├── (app)/           # Protected routes (dashboard, quests, rewards, household, settings)
├── (auth)/          # Public auth routes (login, signup, invite)
├── api/             # API route handlers
├── landing-page.tsx
└── privacy/

lib/
├── auth/            # Session helpers
├── constants/       # Typed constants (routes, API, roles, etc.)
├── db/              # Prisma client + repository implementations
├── i18n/            # Translation hooks and locale context
└── types/           # Shared TypeScript types

components/
├── layout/          # Sidebar, mobile nav, avatar, level badge
└── ui/              # Button, Card, Input, Modal, Badge, etc.
```

---

## License

MIT — do whatever you want with it.

---

<div align="center">
  <sub>vibecoded with love by <a href="https://github.com/jvillegasd">jvillegasd</a></sub>
</div>
