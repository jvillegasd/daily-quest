'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from '@/lib/i18n/use-translation'

interface LevelUpData {
  newLevel: number
  newTitleKey: string
}

interface LevelUpContextValue {
  triggerLevelUp: (data: LevelUpData) => void
}

const LevelUpContext = createContext<LevelUpContextValue>({ triggerLevelUp: () => {} })

export function useLevelUp() {
  return useContext(LevelUpContext)
}

export function LevelUpProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<LevelUpData | null>(null)

  const triggerLevelUp = useCallback((d: LevelUpData) => {
    setData(d)
    setTimeout(() => setData(null), 4000)
  }, [])

  return (
    <LevelUpContext.Provider value={{ triggerLevelUp }}>
      {children}
      <LevelUpToast data={data} />
    </LevelUpContext.Provider>
  )
}

function LevelUpToast({ data }: { data: LevelUpData | null }) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          key={data.newLevel}
          initial={{ opacity: 0, y: -80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -80 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl font-quest"
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--gold)',
              boxShadow: 'var(--shadow-gold)',
              minWidth: '260px',
            }}
          >
            <span className="text-2xl">⚔️</span>
            <div>
              <p className="text-xs text-gold-dim uppercase tracking-widest leading-none mb-0.5">
                Level Up!
              </p>
              <p className="text-base font-bold text-fg leading-tight">
                Level {data.newLevel} — {t(data.newTitleKey)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
