'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: '🏆',
    emojis: ['🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🎀', '🎁', '🎊', '🎉', '🌟', '⭐', '✨', '💫', '🔥', '💯', '👑'],
  },
  {
    label: '🏠',
    emojis: ['🏠', '🛁', '🚿', '🧹', '🧺', '🧽', '🪣', '🧴', '🧻', '🛋️', '🛏️', '🪴', '🚪', '🪟', '🏡', '🌿', '🪑', '🗑️'],
  },
  {
    label: '🍕',
    emojis: ['🍕', '🍔', '🍣', '🍜', '🥘', '🧁', '🎂', '🍰', '🍦', '🍷', '🍺', '☕', '🧃', '🥗', '🍱', '🥐', '🍫', '🍿'],
  },
  {
    label: '🎮',
    emojis: ['🎮', '🎲', '🎭', '🎬', '🎵', '🎸', '🎹', '🎯', '🎳', '♟️', '🎨', '📚', '✏️', '💻', '📱', '🎤', '🎧', '🎻'],
  },
  {
    label: '🌺',
    emojis: ['🌺', '🌸', '🌈', '🦋', '🐶', '🐱', '🌻', '🍀', '🌊', '⚡', '❄️', '🌙', '☀️', '🌤️', '🦄', '🐉', '🌴', '🍁'],
  },
  {
    label: '💎',
    emojis: ['💎', '💰', '🪙', '🔑', '🗝️', '💪', '❤️', '🤝', '👏', '🙌', '✅', '🚀', '⚔️', '🛡️', '🪄', '🧪', '📜', '🏰'],
  },
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  label?: string
}

export function EmojiPicker({ value, onChange, label }: EmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      {label && <p className="text-sm font-semibold text-fg-muted mb-1">{label}</p>}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-10 w-full rounded-lg border text-2xl flex items-center justify-center transition-colors ${
          open ? 'border-gold bg-gold/10' : 'border-border bg-bg-elevated hover:border-gold/60'
        }`}
      >
        {value}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
            className="absolute left-0 top-12 z-50 w-64 card-parchment shadow-xl rounded-xl overflow-hidden"
          >
            {/* Category tabs */}
            <div className="flex border-b border-border">
              {CATEGORIES.map((cat, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTab(i)}
                  className={`flex-1 py-2 text-base transition-colors ${
                    tab === i ? 'bg-gold/15 border-b-2 border-gold' : 'hover:bg-border/30'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-6 gap-0.5 p-2">
              {CATEGORIES[tab].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => { onChange(emoji); setOpen(false) }}
                  className={`h-9 w-full rounded-lg text-xl flex items-center justify-center transition-colors hover:bg-gold/20 ${
                    value === emoji ? 'bg-gold/30 ring-1 ring-gold' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
