import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { translate } from '../lib/i18n'
import type { TranslationKey } from '../lib/i18n'

export type Lang = 'kz' | 'ru' | 'en'

interface LanguageContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'kz',
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('zhetisaybus_lang') as Lang) ?? 'kz'
  })

  const handleSet = (l: Lang) => {
    localStorage.setItem('zhetisaybus_lang', l)
    setLang(l)
  }

  const t = useCallback(
    (key: TranslationKey) => translate(lang, key),
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSet, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  return useContext(LanguageContext)
}

export const LANG_LABELS: Record<Lang, { short: string; full: string }> = {
  kz: { short: 'KZ', full: 'Қазақша' },
  ru: { short: 'RU', full: 'Русский' },
  en: { short: 'EN', full: 'English' },
}
