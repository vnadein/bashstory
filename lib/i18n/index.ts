import { ru } from './ru'
import { en } from './en'

export type Locale = 'ru' | 'en'

export type Translations = typeof ru

const translations: Record<Locale, Translations> = {
  ru,
  en,
}

function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'en'
  
  const browserLang = navigator.language.split('-')[0].toLowerCase()
  if (browserLang === 'ru') return 'ru'
  return 'en'
}

let currentLocale: Locale = 'en'

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}

export function initLocale(): Locale {
  currentLocale = getBrowserLocale()
  return currentLocale
}

export function setUserLocale(lang: string): void {
  if (lang === 'ru' || lang === 'en') {
    currentLocale = lang
  }
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.')
  let value: unknown = translations[currentLocale]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k]
    } else {
      return key
    }
  }
  
  if (typeof value !== 'string') {
    return key
  }
  
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
      return params[paramKey]?.toString() ?? `{{${paramKey}}}`
    })
  }
  
  return value
}

export { ru, en }
