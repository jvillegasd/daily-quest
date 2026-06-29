'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useTranslation } from '@/lib/i18n/use-translation'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import { ROLE, REWARD_TYPE, POINTS_TYPE, FORM_DEFAULTS } from '@/lib/types'
import type { Profile, Reward, Household } from '@/lib/types'
import { API } from '@/lib/constants'
import { ANIMATION } from '@/lib/constants'

interface Props {
  profile: Profile
  initialRewards: Reward[]
  household: Household
}

function RewardCard({ reward, canAfford, onClaim, onEdit, onDelete, loading, isAdmin, t }: {
  reward: Reward
  canAfford: boolean
  onClaim: () => void
  onEdit: () => void
  onDelete: () => void
  loading: boolean
  isAdmin: boolean
  t: (key: string, vars?: Record<string, string | number>) => string
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ type: 'spring', damping: ANIMATION.SPRING_DAMPING, stiffness: ANIMATION.SPRING_STIFFNESS }}
    >
      <Card hover gold={canAfford} className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <div className="text-3xl">{reward.icon}</div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            {isAdmin && (
              <>
                <ActionTooltip label={t('rewards.editAction')}>
                  <Button variant="outline" size="sm" onClick={onEdit} aria-label={t('rewards.editAction')}>
                    <Pencil size={14} />
                  </Button>
                </ActionTooltip>
                <ActionTooltip label={t('rewards.deleteAction')}>
                  <Button variant="danger" size="sm" onClick={onDelete} aria-label={t('rewards.deleteAction')}>
                    <Trash2 size={14} />
                  </Button>
                </ActionTooltip>
              </>
            )}
            <Badge variant={reward.type === REWARD_TYPE.VIRTUAL ? 'sapphire' : 'amber'}>
              {reward.type === 'VIRTUAL' ? t('rewards.virtual') : t('rewards.pledge')}
            </Badge>
            {reward.repeatable && <Badge variant="muted">{t('rewards.repeatable')}</Badge>}
          </div>
        </div>

        <div>
          <h3 className="font-quest font-semibold text-fg">{reward.title}</h3>
          {reward.description && <p className="text-xs text-fg-muted mt-1">{reward.description}</p>}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <Badge variant="gold">
              {reward.cost} {reward.costType === 'PERSONAL' ? t('common.personal') : t('common.shared')} {t('common.pts')}
            </Badge>
            <p className="text-xs text-fg-subtle mt-1">{t('rewards.timesClaimed', { count: reward.timesClaimed })}</p>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={onClaim}
            loading={loading}
            disabled={!canAfford}
          >
            {canAfford ? t('rewards.claim') : t('rewards.locked')}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export function RewardsClient({ profile, initialRewards, household }: Props) {
  const { t } = useTranslation()
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const isAdmin = profile.role === ROLE.ADMIN
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<Reward | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const [claimMsg, setClaimMsg] = useState('')
  const [form, setForm] = useState<{
    title: string; description: string; icon: string
    type: string; cost: number; costType: string; repeatable: boolean; cooldownHours: number
  }>({
    title: '', description: '',
    icon: FORM_DEFAULTS.REWARD.icon,
    type: FORM_DEFAULTS.REWARD.type,
    cost: FORM_DEFAULTS.REWARD.cost,
    costType: FORM_DEFAULTS.REWARD.costType,
    repeatable: FORM_DEFAULTS.REWARD.repeatable,
    cooldownHours: FORM_DEFAULTS.REWARD.cooldownHours,
  })

  function canAfford(reward: Reward) {
    if (reward.costType === POINTS_TYPE.PERSONAL) return profile.personalPoints >= reward.cost
    return household.sharedPoints >= reward.cost
  }

  async function handleClaim(rewardId: string) {
    setLoading(rewardId)
    setClaimMsg('')
    const res = await fetch(API.REWARD_CLAIM(rewardId), { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setClaimMsg(data.error); setLoading(null); return }
    setClaimMsg(t('rewards.claimedSuccess'))
    setLoading(null)
  }

  function blankForm() {
    return { title: '', description: '', icon: FORM_DEFAULTS.REWARD.icon, type: FORM_DEFAULTS.REWARD.type, cost: FORM_DEFAULTS.REWARD.cost, costType: FORM_DEFAULTS.REWARD.costType, repeatable: FORM_DEFAULTS.REWARD.repeatable, cooldownHours: FORM_DEFAULTS.REWARD.cooldownHours }
  }

  function editReward(reward: Reward) {
    setEditing(reward)
    setForm({ title: reward.title, description: reward.description ?? '', icon: reward.icon, type: reward.type, cost: reward.cost, costType: reward.costType, repeatable: reward.repeatable, cooldownHours: reward.cooldownHours })
  }

  function closeForm() {
    setShowCreate(false)
    setEditing(null)
    setForm(blankForm())
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch(editing ? API.REWARD(editing.id) : API.REWARDS, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cost: Number(form.cost), cooldownHours: Number(form.cooldownHours) }),
    })
    if (!res.ok) return
    const { reward } = await res.json()
    setRewards((prev) => editing ? prev.map((r) => r.id === reward.id ? reward : r) : [reward, ...prev])
    closeForm()
  }

  async function handleDelete(rewardId: string) {
    if (!confirm(t('rewards.deleteConfirm'))) return
    const res = await fetch(API.REWARD(rewardId), { method: 'DELETE' })
    if (res.ok) setRewards((prev) => prev.filter((reward) => reward.id !== rewardId))
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-quest text-2xl font-bold text-fg">{t('rewards.title')}</h1>
          <p className="text-fg-muted text-sm">
            {t('rewards.yourRiches')} <span className="text-gold font-semibold">{profile.personalPoints} {t('common.personal')}</span>
            {' '}· <span className="text-sapphire font-semibold">{household.sharedPoints} {t('common.shared')}</span>
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowCreate(true)} size="sm">
            <Plus size={14} /> {t('rewards.newReward')}
          </Button>
        )}
      </div>

      {claimMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-lg bg-gold/10 border border-gold/30 text-gold text-sm font-semibold text-center"
        >
          {claimMsg}
        </motion.div>
      )}

      <AnimatePresence>
        {rewards.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-16 text-fg-muted">
            <div className="text-4xl mb-3">🏆</div>
            <p className="font-quest text-lg">{t('rewards.noTreasures')}</p>
            <p className="text-sm">{t('rewards.noTreasuresSubtitle')}</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                canAfford={canAfford(reward)}
                onClaim={() => handleClaim(reward.id)}
                onEdit={() => editReward(reward)}
                onDelete={() => handleDelete(reward.id)}
                loading={loading === reward.id}
                isAdmin={isAdmin}
                t={t}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <Modal open={showCreate || !!editing} onClose={closeForm} title={editing ? t('rewards.editTitle') : t('rewards.createTitle')}>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            <EmojiPicker label={t('rewards.iconLabel')} value={form.icon} onChange={(emoji) => setForm({ ...form, icon: emoji })} />
            <div className="col-span-4">
              <Input label={t('rewards.rewardTitleLabel')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t('rewards.rewardTitlePlaceholder')} required />
            </div>
          </div>
          <Input label={t('rewards.descriptionLabel')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label={t('rewards.typeLabel')} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value={REWARD_TYPE.PLEDGE}>{t('rewards.typePledge')}</option>
              <option value={REWARD_TYPE.VIRTUAL}>{t('rewards.typeVirtual')}</option>
            </Select>
            <Select label={t('rewards.costFromLabel')} value={form.costType} onChange={(e) => setForm({ ...form, costType: e.target.value })}>
              <option value={POINTS_TYPE.PERSONAL}>{t('rewards.costPersonal')}</option>
              <option value={POINTS_TYPE.SHARED}>{t('rewards.costShared')}</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('rewards.costPtsLabel')} type="number" min={1} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
            <Select label={t('rewards.repeatableLabel')} value={form.repeatable ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, repeatable: e.target.value === 'yes' })}>
              <option value="yes">{t('rewards.repeatableYes')}</option>
              <option value="no">{t('rewards.repeatableNo')}</option>
            </Select>
          </div>
          {form.repeatable && (
            <Input label={t('rewards.cooldownLabel')} type="number" min={1} value={form.cooldownHours} onChange={(e) => setForm({ ...form, cooldownHours: Number(e.target.value) })} />
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={closeForm}>{t('common.cancel')}</Button>
            <Button type="submit" className="flex-1">{editing ? t('common.save') : t('rewards.createRewardBtn')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
