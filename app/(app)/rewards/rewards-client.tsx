'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Profile, Reward, Household } from '@/lib/types'

interface Props {
  profile: Profile
  initialRewards: Reward[]
  household: Household
}

function RewardCard({ reward, canAfford, onClaim, loading }: {
  reward: Reward
  canAfford: boolean
  onClaim: () => void
  loading: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      transition={{ type: 'spring', damping: 20, stiffness: 280 }}
    >
      <Card hover gold={canAfford} className="flex flex-col gap-3 p-5">
        <div className="flex items-start justify-between">
          <div className="text-3xl">{reward.icon}</div>
          <div className="flex gap-1.5 flex-wrap justify-end">
            <Badge variant={reward.type === 'VIRTUAL' ? 'sapphire' : 'amber'}>
              {reward.type === 'VIRTUAL' ? '✨ Virtual' : '🎁 Pledge'}
            </Badge>
            {reward.repeatable && <Badge variant="muted">↺ Repeatable</Badge>}
          </div>
        </div>

        <div>
          <h3 className="font-quest font-semibold text-fg">{reward.title}</h3>
          {reward.description && <p className="text-xs text-fg-muted mt-1">{reward.description}</p>}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <Badge variant="gold">
              {reward.cost} {reward.costType === 'PERSONAL' ? 'personal' : 'shared'} pts
            </Badge>
            <p className="text-xs text-fg-subtle mt-1">{reward.timesClaimed}× claimed</p>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={onClaim}
            loading={loading}
            disabled={!canAfford}
          >
            {canAfford ? '🏆 Claim' : '🔒 Locked'}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}

export function RewardsClient({ profile, initialRewards, household }: Props) {
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [showCreate, setShowCreate] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [claimMsg, setClaimMsg] = useState('')
  const [form, setForm] = useState({
    title: '', description: '', icon: '🏆', type: 'PLEDGE',
    cost: 100, costType: 'PERSONAL', repeatable: true, cooldownHours: 24,
  })

  function canAfford(reward: Reward) {
    if (reward.costType === 'PERSONAL') return profile.personalPoints >= reward.cost
    return household.sharedPoints >= reward.cost
  }

  async function handleClaim(rewardId: string) {
    setLoading(rewardId)
    setClaimMsg('')
    const res = await fetch(`/api/rewards/${rewardId}/claim`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setClaimMsg(data.error); setLoading(null); return }
    setClaimMsg('🏆 Treasure claimed!')
    setLoading(null)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/rewards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cost: Number(form.cost), cooldownHours: Number(form.cooldownHours) }),
    })
    const { reward } = await res.json()
    setRewards((prev) => [reward, ...prev])
    setShowCreate(false)
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-quest text-2xl font-bold text-fg">Treasure Room</h1>
          <p className="text-fg-muted text-sm">
            Your riches: <span className="text-gold font-semibold">{profile.personalPoints} personal</span>
            {' '}· <span className="text-sapphire font-semibold">{household.sharedPoints} shared</span>
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus size={14} /> New Reward
        </Button>
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
            <p className="font-quest text-lg">No treasures yet</p>
            <p className="text-sm">Create rewards to motivate your party</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                canAfford={canAfford(reward)}
                onClaim={() => handleClaim(reward.id)}
                loading={loading === reward.id}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="🏆 Create Reward">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            <Input label="Icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="col-span-1 text-center text-xl" />
            <div className="col-span-4">
              <Input label="Reward Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Dinner of my choice..." required />
            </div>
          </div>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details..." />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="PLEDGE">🎁 Real-world pledge</option>
              <option value="VIRTUAL">✨ Virtual badge</option>
            </Select>
            <Select label="Cost From" value={form.costType} onChange={(e) => setForm({ ...form, costType: e.target.value })}>
              <option value="PERSONAL">Personal points</option>
              <option value="SHARED">Shared bank</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Cost (pts)" type="number" min={1} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
            <Select label="Repeatable" value={form.repeatable ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, repeatable: e.target.value === 'yes' })}>
              <option value="yes">Yes</option>
              <option value="no">One-time</option>
            </Select>
          </div>
          {form.repeatable && (
            <Input label="Cooldown (hours)" type="number" min={1} value={form.cooldownHours} onChange={(e) => setForm({ ...form, cooldownHours: Number(e.target.value) })} />
          )}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" className="flex-1">Create Reward</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
