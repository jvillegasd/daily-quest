'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, SkipForward } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Avatar } from '@/components/layout/avatar'
import { useTranslation } from '@/lib/i18n/use-translation'
import type { Profile, Task, Category } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es as esLocale } from 'date-fns/locale'

interface Props {
  profile: Profile
  initialTasks: Task[]
  categories: Category[]
  members: Profile[]
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            background: ['#c9a84c', '#e6b84a', '#16a34a', '#2563eb', '#dc2626'][i % 5],
          }}
          animate={{ y: '110vh', rotate: Math.random() * 720, x: (Math.random() - 0.5) * 200 }}
          transition={{ duration: 1.5 + Math.random(), ease: 'easeIn', delay: Math.random() * 0.3 }}
        />
      ))}
    </div>
  )
}

export function QuestsClient({ profile, initialTasks, categories, members }: Props) {
  const { locale, t } = useTranslation()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<'all' | 'mine' | 'open' | 'done'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', categoryId: categories[0]?.id ?? '',
    points: 10, pointsType: 'PERSONAL', type: 'ONE_OFF',
    assignedToId: '', dueAt: '', recurrenceRule: '',
  })

  const filtered = tasks.filter((task) => {
    if (filter === 'mine') return task.assignedToId === profile.id && task.status === 'PENDING'
    if (filter === 'open') return !task.assignedToId && task.status === 'PENDING'
    if (filter === 'done') return task.status === 'DONE'
    return true
  }).filter((task) => !categoryFilter || task.categoryId === categoryFilter)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        points: Number(form.points),
        assignedToId: form.assignedToId || null,
        dueAt: form.dueAt || null,
        recurrenceRule: form.type === 'RECURRING' ? form.recurrenceRule : null,
      }),
    })
    const { task } = await res.json()
    setTasks((prev) => [task, ...prev])
    setShowCreate(false)
    setForm({ title: '', description: '', categoryId: categories[0]?.id ?? '', points: 10, pointsType: 'PERSONAL', type: 'ONE_OFF', assignedToId: '', dueAt: '', recurrenceRule: '' })
  }

  async function handleComplete(taskId: string) {
    setLoading(taskId)
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' }),
    })
    const { task } = await res.json()
    setTasks((prev) => prev.map((item) => item.id === taskId ? task : item))
    setCelebrating(true)
    setTimeout(() => setCelebrating(false), 2000)
    setLoading(null)
  }

  async function handleSkip(taskId: string) {
    setLoading(taskId)
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'skip' }),
    })
    const { task } = await res.json()
    setTasks((prev) => prev.map((t) => t.id === taskId ? task : t))
    setLoading(null)
  }

  const dateLocale = locale === 'es' ? esLocale : undefined

  const filterLabels: Record<typeof filter, string> = {
    all: t('quests.filterAll'),
    mine: t('quests.filterMine'),
    open: t('quests.filterOpen'),
    done: t('quests.filterDone'),
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {celebrating && <Confetti />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-quest text-2xl font-bold text-fg">{t('quests.title')}</h1>
          <p className="text-fg-muted text-sm">{t('quests.questsAwait', { count: tasks.filter((task) => task.status === 'PENDING').length })}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus size={14} /> {t('quests.newQuest')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(['all', 'mine', 'open', 'done'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
              filter === f ? 'bg-gold/20 text-gold border-gold/40' : 'border-border text-fg-muted hover:text-fg'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1 rounded-full text-xs font-semibold border border-border bg-bg-elevated text-fg-muted focus:outline-none focus:border-gold"
        >
          <option value="">{t('quests.allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
      </div>

      {/* Task list */}
      <AnimatePresence>
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-center py-16 text-fg-muted">
            <div className="text-4xl mb-3">📜</div>
            <p className="font-quest text-lg">{t('quests.noQuestsFound')}</p>
            <p className="text-sm">{t('quests.noQuestsSubtitle')}</p>
          </motion.div>
        )}
        {filtered.map((task) => {
          const cat = categories.find((c) => c.id === task.categoryId)
          const assignee = members.find((m) => m.id === task.assignedToId)
          const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status === 'PENDING'

          return (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="mb-3"
            >
              <Card className={task.status === 'DONE' ? 'opacity-60' : ''}>
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${cat?.color ?? '#c9a84c'}20` }}
                  >
                    {cat?.icon ?? '📜'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-fg ${task.status === 'DONE' ? 'line-through text-fg-muted' : ''}`}>
                        {task.title}
                      </p>
                      {task.type === 'RECURRING' && <Badge variant="sapphire">{t('quests.recurring')}</Badge>}
                      {isOverdue && <Badge variant="ruby">{t('quests.overdue')}</Badge>}
                    </div>

                    {task.description && <p className="text-xs text-fg-muted mt-0.5">{task.description}</p>}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge variant="gold">+{task.points} {task.pointsType === 'PERSONAL' ? t('common.personal') : t('common.shared')}</Badge>
                      {cat && <Badge variant="muted">{cat.name}</Badge>}
                      {task.dueAt && (
                        <span className={`text-xs ${isOverdue ? 'text-ruby' : 'text-fg-subtle'}`}>
                          Due {formatDistanceToNow(new Date(task.dueAt), { addSuffix: true, locale: dateLocale })}
                        </span>
                      )}
                      {assignee ? (
                        <div className="flex items-center gap-1">
                          <Avatar displayName={assignee.displayName} avatarUrl={assignee.avatarUrl} level={assignee.level} personalPoints={assignee.personalPoints} size="sm" showLevel={false} />
                          <span className="text-xs text-fg-muted">{assignee.displayName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald font-semibold">{t('quests.openQuest')}</span>
                      )}
                    </div>
                  </div>

                  {task.status === 'PENDING' && (
                    <div className="flex gap-1.5 shrink-0">
                      <Button
                        variant="emerald" size="sm"
                        onClick={() => handleComplete(task.id)}
                        loading={loading === task.id}
                        title="Complete"
                      >
                        <Check size={14} />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => handleSkip(task.id)}
                        loading={loading === task.id}
                        title="Skip"
                      >
                        <SkipForward size={14} />
                      </Button>
                    </div>
                  )}

                  {task.status === 'DONE' && (
                    <Badge variant="emerald">{t('quests.done')}</Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Create Quest Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title={t('quests.createTitle')}>
        <form onSubmit={handleCreate} className="space-y-3">
          <Input label={t('quests.questTitleLabel')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('quests.questTitlePlaceholder')} required />
          <Input label={t('quests.descriptionLabel')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t('quests.descriptionPlaceholder')} />

          <div className="grid grid-cols-2 gap-3">
            <Select label={t('quests.categoryLabel')} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </Select>
            <Select label={t('quests.typeLabel')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="ONE_OFF">{t('quests.typeOneOff')}</option>
              <option value="RECURRING">{t('quests.typeRecurring')}</option>
            </Select>
          </div>

          {form.type === 'RECURRING' && (
            <Input label={t('quests.recurrenceLabel')} value={form.recurrenceRule} onChange={(e) => setForm({ ...form, recurrenceRule: e.target.value })} placeholder={t('quests.recurrencePlaceholder')} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label={t('quests.pointsLabel')} type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
            <Select label={t('quests.pointsTypeLabel')} value={form.pointsType} onChange={(e) => setForm({ ...form, pointsType: e.target.value })}>
              <option value="PERSONAL">{t('quests.pointsTypePersonal')}</option>
              <option value="SHARED">{t('quests.pointsTypeShared')}</option>
            </Select>
          </div>

          <Select label={t('quests.assignToLabel')} value={form.assignedToId} onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}>
            <option value="">{t('quests.assignToOpen')}</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.displayName}</option>)}
          </Select>

          <Input label={t('quests.dueDateLabel')} type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} />

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>{t('common.cancel')}</Button>
            <Button type="submit" className="flex-1">{t('quests.createQuestBtn')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
