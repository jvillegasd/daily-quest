'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Send, Pencil } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, LevelBadge } from '@/components/layout/avatar'
import { useTranslation } from '@/lib/i18n/use-translation'
import { EmojiPicker } from '@/components/ui/emoji-picker'
import type { Profile, Household, Category } from '@/lib/types'

interface Props {
  profile: Profile
  household: Household
  members: Profile[]
  categories: Category[]
}

export function HouseholdClient({ profile, household, members, categories: initialCats }: Props) {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<Category[]>(initialCats)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState('')
  const [newCat, setNewCat] = useState({ name: '', icon: '📌', color: '#c9a84c', defaultPoints: 10 })
  const [addingCat, setAddingCat] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', icon: '', color: '', defaultPoints: 10 })

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    const res = await fetch('/api/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    })
    setInviteMsg(res.ok ? t('household.inviteSent') : t('household.inviteFailed'))
    setInviting(false)
    setInviteEmail('')
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newCat, defaultPoints: Number(newCat.defaultPoints) }),
    })
    const { category } = await res.json()
    setCategories((prev) => [...prev, category])
    setNewCat({ name: '', icon: '📌', color: '#c9a84c', defaultPoints: 10 })
    setAddingCat(false)
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id)
    setEditForm({ name: cat.name, icon: cat.icon, color: cat.color, defaultPoints: cat.defaultPoints })
  }

  async function handleSaveEdit(e: React.FormEvent, id: string) {
    e.preventDefault()
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, defaultPoints: Number(editForm.defaultPoints) }),
    })
    const { category } = await res.json()
    setCategories((prev) => prev.map((c) => c.id === id ? category : c))
    setEditingId(null)
  }

  async function handleDeleteCategory(id: string) {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-quest text-2xl font-bold text-fg">🏰 {household.name}</h1>
        <p className="text-fg-muted text-sm">{t('household.subtitle')}</p>
      </div>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle>{t('household.partyMembers')}</CardTitle>
          <Badge variant="muted">{t('household.heroCount', { count: members.length })}</Badge>
        </CardHeader>
        <div className="space-y-3">
          {members.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated border border-border"
            >
              <Avatar
                displayName={member.displayName}
                avatarUrl={member.avatarUrl}
                level={member.level}
                personalPoints={member.personalPoints}
                size="md"
              />
              <div className="flex-1">
                <p className="font-semibold text-fg">{member.displayName}</p>
                <LevelBadge level={member.level} />
              </div>
              <div className="text-right">
                <p className="text-sm font-quest font-bold text-gold">{member.personalPoints}</p>
                <p className="text-xs text-fg-muted">{t('household.personalPts')}</p>
              </div>
              {member.role === 'ADMIN' && <Badge variant="gold">{t('common.admin')}</Badge>}
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle>{t('household.inviteHero')}</CardTitle>
        </CardHeader>
        <form onSubmit={handleInvite} className="flex gap-2">
          <Input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t('household.invitePlaceholder')}
            type="email"
            className="flex-1"
            required
          />
          <Button type="submit" size="md" loading={inviting}>
            <Send size={14} /> {t('household.inviteBtn')}
          </Button>
        </form>
        {inviteMsg && <p className="text-sm text-emerald mt-2">{inviteMsg}</p>}
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle>{t('household.questCategories')}</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddingCat(!addingCat)}>
            <Plus size={14} /> {t('household.addBtn')}
          </Button>
        </CardHeader>

        {addingCat && (
          <motion.form
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            onSubmit={handleAddCategory}
            className="mb-4 p-3 rounded-lg bg-bg-elevated border border-border space-y-3"
          >
            <div className="grid grid-cols-4 gap-2">
              <EmojiPicker label={t('household.categoryIconLabel')} value={newCat.icon} onChange={(emoji) => setNewCat({ ...newCat, icon: emoji })} />
              <div className="col-span-3">
                <Input label={t('household.categoryNameLabel')} value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder={t('household.categoryNamePlaceholder')} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-fg-muted">{t('household.categoryColorLabel')}</label>
                <input type="color" value={newCat.color} onChange={(e) => setNewCat({ ...newCat, color: e.target.value })} className="h-9 w-full rounded-lg border border-border cursor-pointer" />
              </div>
              <Input label={t('household.categoryDefaultPtsLabel')} type="number" min={1} value={newCat.defaultPoints} onChange={(e) => setNewCat({ ...newCat, defaultPoints: Number(e.target.value) })} />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setAddingCat(false)}>{t('common.cancel')}</Button>
              <Button type="submit" size="sm" className="flex-1">{t('household.addCategory')}</Button>
            </div>
          </motion.form>
        )}

        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id}>
              <AnimatePresence mode="wait">
                {editingId === cat.id ? (
                  <motion.form
                    key="edit"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    onSubmit={(e) => handleSaveEdit(e, cat.id)}
                    className="p-3 rounded-lg bg-bg-elevated border border-gold/40 space-y-3"
                  >
                    <div className="grid grid-cols-4 gap-2">
                      <EmojiPicker label={t('household.categoryIconLabel')} value={editForm.icon} onChange={(emoji) => setEditForm({ ...editForm, icon: emoji })} />
                      <div className="col-span-3">
                        <Input label={t('household.categoryNameLabel')} value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-semibold text-fg-muted">{t('household.categoryColorLabel')}</label>
                        <input type="color" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="h-9 w-full rounded-lg border border-border cursor-pointer" />
                      </div>
                      <Input label={t('household.categoryDefaultPtsLabel')} type="number" min={1} value={editForm.defaultPoints} onChange={(e) => setEditForm({ ...editForm, defaultPoints: Number(e.target.value) })} />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="sm" className="flex-1" onClick={() => setEditingId(null)}>{t('common.cancel')}</Button>
                      <Button type="submit" size="sm" className="flex-1">{t('common.save')}</Button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="row"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-elevated border border-border"
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: `${cat.color}25` }}>
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-fg">{cat.name}</p>
                      <p className="text-xs text-fg-muted">{t('household.defaultPts', { count: cat.defaultPoints })}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => startEdit(cat)}>
                      <Pencil size={12} />
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteCategory(cat.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
