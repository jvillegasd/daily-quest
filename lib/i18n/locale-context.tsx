'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type enJson from '@/locales/en.json'

export type Locale = 'en' | 'es'
export const SUPPORTED_LOCALES = ['en', 'es'] as const satisfies readonly Locale[]
export const DEFAULT_LOCALE: Locale = 'en'
export type Translations = typeof enJson

const STORAGE_KEY = 'dq_locale'

type ContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<ContextValue | null>(null)

const cache: Partial<Record<Locale, Translations>> = {}

async function loadDictionary(locale: Locale): Promise<Translations> {
  if (cache[locale]) return cache[locale]!
  const mod = locale === 'en'
    ? await import('@/locales/en.json')
    : await import('@/locales/es.json')
  cache[locale] = mod.default as Translations
  return cache[locale]!
}

function resolve(obj: unknown, key: string): string {
  const result = key.split('.').reduce<unknown>((acc, part) => {
    if (acc !== null && typeof acc === 'object') return (acc as Record<string, unknown>)[part]
    return undefined
  }, obj)
  return typeof result === 'string' ? result : key
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`))
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [dict, setDict] = useState<Translations | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const safe: Locale = (SUPPORTED_LOCALES as readonly string[]).includes(stored ?? '') ? (stored as Locale) : DEFAULT_LOCALE
    setLocaleState(safe)
    document.documentElement.lang = safe
    loadDictionary(safe).then(setDict)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.cookie = `${STORAGE_KEY}=${l};path=/;max-age=31536000;SameSite=Lax`
    document.documentElement.lang = l
    loadDictionary(l).then(setDict)
  }, [])

  const t = useCallback((key: string, vars?: Record<string, string | number>): string => {
    if (!dict) return key
    return interpolate(resolve(dict, key), vars)
  }, [dict])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
