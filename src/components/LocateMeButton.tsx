import { Crosshair, CircleNotch as Loader } from '@phosphor-icons/react'
import { useLang } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

interface LocateMeButtonProps {
  onClick: () => void
  isActive: boolean
  isLoading?: boolean
}

/**
 * Pill button anchored just above the bottom sheet.
 * Uses --bs-visible CSS variable (set by BottomSheet) to stay above the sheet
 * as the user drags it up and down.
 */
export default function LocateMeButton({ onClick, isActive, isLoading = false }: LocateMeButtonProps) {
  const { t } = useLang()
  const { tk } = useTheme()
  const iconColor = isActive ? '#1A1A1B' : tk.text

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="absolute left-4 z-[1000] flex items-center gap-2 pl-3 pr-4 h-11 rounded-full shadow-lg active:scale-95 transition-all disabled:opacity-70"
      style={{
        bottom: 'calc(var(--bs-visible, 232px) + 14px)',
        background: isActive ? '#FFD700' : tk.surfaceGlass,
        backdropFilter: isActive ? 'none' : tk.glassFilter,
        WebkitBackdropFilter: isActive ? 'none' : tk.glassFilter,
        border: isActive ? '1px solid transparent' : `1px solid ${tk.border}`,
      }}
      aria-label={t('where_am_i')}
    >
      {isLoading ? (
        <Loader
          size={18}
          className="animate-spin flex-shrink-0"
          style={{ color: iconColor }}
        />
      ) : (
        <Crosshair
          size={18}
          className="flex-shrink-0"
          style={{ color: iconColor }}
        />
      )}
      <span
        className="text-sm font-semibold whitespace-nowrap"
        style={{
          color: iconColor,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {isLoading ? t('locating') : t('where_am_i')}
      </span>
    </button>
  )
}
