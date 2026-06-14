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
import { useLevelUp } from '@/components/level-up-toast'
import { hexToRgba } from '@/lib/utils/color'
import { TASK_STATUS, TASK_TYPE, POINTS_TYPE, TASK_FILTER, TASK_ACTION, FORM_DEFAULTS, type TaskFilter } from '@/lib/types'
import type { Profile, Task, Category } from '@/lib/types'
import { API } from '@/lib/constants'
import { ANIMATION, CONFETTI } from '@/lib/constants'
import { formatDistanceToNow } from 'date-fns'
import { es as esLocale } from 'date-fns/locale'
import { SUPPORTED_LOCALES } from '@/lib/i18n/locale-context'

interface Props {
  profile: Profile
  initialTasks: Task[]
  categories: Category[]
  members: Profile[]
}

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: CONFETTI.COUNT }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-10%',
            background: CONFETTI.COLORS[i % CONFETTI.COLORS.length],
          }}
          animate={{ y: '110vh', rotate: Math.random() * CONFETTI.MAX_ROTATION, x: (Math.random() - 0.5) * 200 }}
          transition={{ duration: CONFETTI.DURATION + Math.random(), ease: 'easeIn', delay: Math.random() * CONFETTI.MAX_DELAY }}
        />
      ))}
    </div>
  )
}

export function QuestsClient({ profile, initialTasks, categories, members }: Props) {
  const { locale, t } = useTranslation()
  const { triggerLevelUp } = useLevelUp()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [filter, setFilter] = useState<TaskFilter>(TASK_FILTER.ALL)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)

  const [form, setForm] = useState<{
    title: string; description: string; categoryId: string
    points: number; pointsType: string; type: string
    assignedToId: string; dueAt: string; recurrenceRule: string
  }>({
    title: '', description: '', categoryId: categories[0]?.id ?? '',
    points: FORM_DEFAULTS.TASK.points, pointsType: FORM_DEFAULTS.TASK.pointsType, type: FORM_DEFAULTS.TASK.type,
    assignedToId: '', dueAt: '', recurrenceRule: '',
  })

  const filtered = tasks.filter((task) => {
    if (filter === TASK_FILTER.MINE) return task.assignedToId === profile.id && task.status === TASK_STATUS.PENDING
    if (filter === TASK_FILTER.OPEN) return !task.assignedToId && task.status === TASK_STATUS.PENDING
    if (filter === TASK_FILTER.DONE) return task.status === TASK_STATUS.DONE
    return true
  }).filter((task) => !categoryFilter || task.categoryId === categoryFilter)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(API.TASKS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        points: Number(form.points),
        assignedToId: form.assignedToId || null,
        dueAt: form.dueAt || null,
        recurrenceRule: form.type === TASK_TYPE.RECURRING ? form.recurrenceRule : null,
      }),
    })
    const { task } = await res.json()
    setTasks((prev) => [task, ...prev])
    setShowCreate(false)
    setForm({ title: '', description: '', categoryId: categories[0]?.id ?? '', points: FORM_DEFAULTS.TASK.points, pointsType: FORM_DEFAULTS.TASK.pointsType, type: FORM_DEFAULTS.TASK.type, assignedToId: '', dueAt: '', recurrenceRule: '' })
  }

  async function handleComplete(taskId: string) {
    setLoading(taskId)
    const res = await fetch(API.TASK(taskId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: TASK_ACTION.COMPLETE }),
    })
    const { task, levelUp } = await res.json()
    setTasks((prev) => prev.map((item) => item.id === taskId ? task : item))
    if (levelUp) triggerLevelUp(levelUp)
    setCelebrating(true)
    setTimeout(() => setCelebrating(false), ANIMATION.CELEBRATION_MS)
    setLoading(null)
  }

  async function handleSkip(taskId: string) {
    setLoading(taskId)
    const res = await fetch(API.TASK(taskId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: TASK_ACTION.SKIP }),
    })
    const { task } = await res.json()
    setTasks((prev) => prev.map((t) => t.id === taskId ? task : t))
    setLoading(null)
  }

  const dateLocale = locale === SUPPORTED_LOCALES[1] ? esLocale : undefined

  const filterLabels: Record<TaskFilter, string> = {
    [TASK_FILTER.ALL]: t('quests.filterAll'),
    [TASK_FILTER.MINE]: t('quests.filterMine'),
    [TASK_FILTER.OPEN]: t('quests.filterOpen'),
    [TASK_FILTER.DONE]: t('quests.filterDone'),
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {celebrating && <Confetti />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-quest text-2xl font-bold text-fg">{t('quests.title')}</h1>
          <p className="text-fg-muted text-sm">{t('quests.questsAwait', { count: tasks.filter((task) => task.status === TASK_STATUS.PENDING).length })}</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus size={14} /> {t('quests.newQuest')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap mb-4">
        {(Object.values(TASK_FILTER) as TaskFilter[]).map((f) => (
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
              transition={{ type: 'spring', damping: ANIMATION.SPRING_DAMPING, stiffness: ANIMATION.SPRING_STIFFNESS }}
              className="mb-3"
            >
              <Card className={task.status === TASK_STATUS.DONE ? 'opacity-60' : ''}>
                <div className="flex items-start gap-3">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: hexToRgba(cat?.color ?? '#c9a84c', 0.18) }}
                  >
                    {cat?.icon ?? '📜'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-semibold text-fg ${task.status === TASK_STATUS.DONE ? 'line-through text-fg-muted' : ''}`}>
                        {task.title}
                      </p>
                      {task.type === TASK_TYPE.RECURRING && <Badge variant="sapphire">{t('quests.recurring')}</Badge>}
                      {isOverdue && <Badge variant="ruby">{t('quests.overdue')}</Badge>}
                    </div>

                    {task.description && <p className="text-xs text-fg-muted mt-0.5">{task.description}</p>}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge variant="gold">+{task.points} {task.pointsType === POINTS_TYPE.PERSONAL ? t('common.personal') : t('common.shared')}</Badge>
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

                  {task.status === TASK_STATUS.PENDING && (
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

                  {task.status === TASK_STATUS.DONE && (
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
              <option value={TASK_TYPE.ONE_OFF}>{t('quests.typeOneOff')}</option>
              <option value={TASK_TYPE.RECURRING}>{t('quests.typeRecurring')}</option>
            </Select>
          </div>

          {form.type === TASK_TYPE.RECURRING && (
            <Input label={t('quests.recurrenceLabel')} value={form.recurrenceRule} onChange={(e) => setForm({ ...form, recurrenceRule: e.target.value })} placeholder={t('quests.recurrencePlaceholder')} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input label={t('quests.pointsLabel')} type="number" min={1} value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
            <Select label={t('quests.pointsTypeLabel')} value={form.pointsType} onChange={(e) => setForm({ ...form, pointsType: e.target.value })}>
              <option value={POINTS_TYPE.PERSONAL}>{t('quests.pointsTypePersonal')}</option>
              <option value={POINTS_TYPE.SHARED}>{t('quests.pointsTypeShared')}</option>
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
