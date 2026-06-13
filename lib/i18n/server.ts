import en from '@/locales/en.json'
import es from '@/locales/es.json'
import type { Locale } from './locale-context'

const TRANSLATIONS: Record<Locale, Record<string, unknown>> = { en, es }

export function serverT(locale: Locale, key: string): string {
  const parts = key.split('.')
  let node: unknown = TRANSLATIONS[locale] ?? TRANSLATIONS.en
  for (const p of parts) {
    if (node !== null && typeof node === 'object') {
      node = (node as Record<string, unknown>)[p]
    } else {
      return key
    }
  }
  return typeof node === 'string' ? node : key
}
