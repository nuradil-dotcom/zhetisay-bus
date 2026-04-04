import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'light' | 'dark'

/** Semantic design tokens resolved for the current theme. */
export interface ThemeTokens {
  // Backgrounds
  bg: string
  surface: string
  surfaceSolid: string
  surfaceGlass: string
  inputBg: string
  menuBg: string
  itemHover: string
  // Effects
  glassFilter: string
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
  surface: 'rgba(255, 255, 255, 0.6)',
  surfaceSolid: '#FFFFFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.5)',
  inputBg: 'rgba(255, 255, 255, 0.7)',
  menuBg: 'rgba(255, 255, 255, 0.85)',
  itemHover: 'rgba(0, 0, 0, 0.05)',
  glassFilter: 'blur(32px) saturate(110%)',
  border: 'rgba(255, 255, 255, 0.65)',
  divider: 'rgba(0, 0, 0, 0.06)',
  text: '#1A1A1B',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  dragHandle: 'rgba(0, 0, 0, 0.2)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  yellow: '#FFD700',
  yellowText: '#1A1A1B',
}

const DARK: ThemeTokens = {
  bg: '#1A1A1B',
  surface: 'rgba(26, 26, 27, 0.6)',
  surfaceSolid: '#1A1A1B',
  surfaceGlass: 'rgba(26, 26, 27, 0.5)',
  inputBg: 'rgba(26, 26, 27, 0.7)',
  menuBg: 'rgba(26, 26, 27, 0.85)',
  itemHover: 'rgba(255, 255, 255, 0.08)',
  glassFilter: 'blur(32px) saturate(110%)',
  border: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.08)',
  text: '#F3F4F6',
  textSecondary: '#D1D5DB',
  textMuted: '#6B7280',
  dragHandle: 'rgba(255, 255, 255, 0.25)',
  shadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
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
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [tk.bg, theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, tk, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
