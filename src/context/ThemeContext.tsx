import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'

/** Semantic design tokens resolved for the current theme. */
export interface ThemeTokens {
  // Backgrounds
  bg: string
  surface: string
  surfaceSolid: string
  inputBg: string
  menuBg: string
  itemHover: string
  // Borders
  border: string
  divider: string
  // Text
  text: string
  textSecondary: string
  textMuted: string
  // Drag handle
  dragHandle: string
  // Shadow
  shadow: string
  // Brand (same in both themes)
  yellow: string
  yellowText: string
}

const LIGHT: ThemeTokens = {
  bg: '#F5F3EF',
  surface: 'rgba(255,255,255,0.85)',
  surfaceSolid: '#FFFFFF',
  inputBg: 'rgba(255,255,255,0.96)',
  menuBg: '#FFFFFF',
  itemHover: 'rgba(0,0,0,0.04)',
  border: 'rgba(0,0,0,0.07)',
  divider: '#F3F4F6',
  text: '#1A1A1B',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  dragHandle: 'rgba(0,0,0,0.18)',
  shadow: '0 4px 24px rgba(0,0,0,0.13)',
  yellow: '#FFD700',
  yellowText: '#1A1A1B',
}

const DARK: ThemeTokens = {
  bg: '#1A1A1B',
  surface: 'rgba(30,30,31,0.92)',
  surfaceSolid: '#1E1E1F',
  inputBg: 'rgba(30,30,31,0.98)',
  menuBg: '#1A1A1B',
  itemHover: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.09)',
  divider: 'rgba(255,255,255,0.07)',
  text: '#F3F4F6',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  dragHandle: 'rgba(255,255,255,0.18)',
  shadow: '0 4px 24px rgba(0,0,0,0.55)',
  yellow: '#FFD700',
  yellowText: '#1A1A1B',
}

interface ThemeContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  tk: ThemeTokens
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  tk: LIGHT,
  isDark: false,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('zhetisaybus_theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  const setTheme = (t: Theme) => {
    localStorage.setItem('zhetisaybus_theme', t)
    setThemeState(t)
  }

  const tk = theme === 'dark' ? DARK : LIGHT

  // Sync a CSS variable on <html> so index.css body/root background follows the theme
  useEffect(() => {
    document.documentElement.style.setProperty('--app-bg', tk.bg)
  }, [tk.bg])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, tk, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
