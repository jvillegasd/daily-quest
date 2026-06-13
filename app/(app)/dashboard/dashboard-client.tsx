'use client'

import { motion, type Variants } from 'framer-motion'
import { Sword, Shield, Trophy, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, LevelBadge } from '@/components/layout/avatar'
import { getPointsForLevel, getLevelFromPoints } from '@/lib/types'
import { useTranslation } from '@/lib/i18n/use-translation'
import type { Profile, Task, Reward, Household } from '@/lib/types'

interface Props {
  profile: Profile
  tasks: Task[]
  rewards: Reward[]
  members: Profile[]
  household: Household
}

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, damping: 20, stiffness: 300 } },
}

export function DashboardClient({ profile, tasks, rewards, members, household }: Props) {
  const { t } = useTranslation()
  const pending = tasks.filter((task) => task.status === 'PENDING')
  const done = tasks.filter((task) => task.status === 'DONE')
  const myTasks = pending.filter((task) => task.assignedToId === profile.id || !task.assignedToId)

  const nextLevelPoints = getPointsForLevel(profile.level + 1)
  const currentLevelPoints = getPointsForLevel(profile.level)
  const xpProgress = Math.round(
    ((profile.personalPoints - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100
  )

  const sorted = [...members].sort((a, b) => b.personalPoints - a.personalPoints)

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-quest text-2xl md:text-3xl font-bold text-fg">
          {t('dashboard.kingdomOf')} <span className="text-gold">{household.name}</span>
        </h1>
        <p className="text-fg-muted text-sm mt-1">{t('dashboard.welcomeBack', { name: profile.displayName })}</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Stat cards */}
        {[
          { icon: Sword, label: t('dashboard.activeQuests'), value: myTasks.length, variant: 'amber' as const, color: 'var(--amber)' },
          { icon: Shield, label: t('dashboard.completed'), value: done.length, variant: 'emerald' as const, color: 'var(--emerald)' },
          { icon: Trophy, label: t('dashboard.yourPoints'), value: profile.personalPoints, variant: 'gold' as const, color: 'var(--gold)' },
          { icon: Clock, label: t('dashboard.sharedBank'), value: household.sharedPoints, variant: 'sapphire' as const, color: 'var(--sapphire)' },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div key={label} variants={item}>
            <Card className="flex items-center gap-4 p-5">
              <div className="rounded-xl p-3" style={{ background: `${color}20` }}>
                <Icon size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-fg-muted font-semibold">{label}</p>
                <p className="text-2xl font-bold font-quest text-fg">{value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-4 mt-4 md:grid-cols-2">
        {/* XP Progress */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.yourCharacter')}</CardTitle>
              <LevelBadge level={profile.level} />
            </CardHeader>
            <div className="flex items-center gap-4 mb-3">
              <Avatar
                displayName={profile.displayName}
                avatarUrl={profile.avatarUrl}
                level={profile.level}
                personalPoints={profile.personalPoints}
                size="lg"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-fg mb-1">{profile.displayName}</p>
                <p className="text-xs text-fg-muted mb-2">{t('dashboard.xpFormat', { current: profile.personalPoints, max: nextLevelPoints })}</p>
                <div className="xp-bar">
                  <motion.div
                    className="xp-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Party Leaderboard */}
        <motion.div variants={item} initial="hidden" animate="show">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.partyMembers')}</CardTitle>
              <Badge variant="gold">🏰 {household.name}</Badge>
            </CardHeader>
            <div className="space-y-3">
              {sorted.map((member, i) => {
                const nextPts = getPointsForLevel(member.level + 1)
                const curPts = getPointsForLevel(member.level)
                const pct = Math.round(((member.personalPoints - curPts) / (nextPts - curPts)) * 100)
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <span className="text-sm font-quest font-bold text-fg-muted w-4">{i + 1}</span>
                    <Avatar
                      displayName={member.displayName}
                      avatarUrl={member.avatarUrl}
                      level={member.level}
                      personalPoints={member.personalPoints}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-fg truncate">{member.displayName}</p>
                        <span className="text-xs text-gold font-quest">{member.personalPoints} {t('common.pts')}</span>
                      </div>
                      <div className="xp-bar mt-1">
                        <div className="xp-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </motion.div>

        {/* Recent Quests */}
        <motion.div variants={item} initial="hidden" animate="show" className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.myActiveQuests')}</CardTitle>
              <Badge variant="amber">{t('dashboard.pending', { count: myTasks.length })}</Badge>
            </CardHeader>
            {myTasks.length === 0 ? (
              <p className="text-fg-muted text-sm text-center py-6">{t('dashboard.allQuestsComplete')}</p>
            ) : (
              <div className="space-y-2">
                {myTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border">
                    <span className="text-lg">{task.category?.icon ?? '📜'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">{task.title}</p>
                      <p className="text-xs text-fg-muted">{task.category?.name}</p>
                    </div>
                    <Badge variant="gold">+{task.points}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
