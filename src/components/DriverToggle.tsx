import { Navigation } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import type { BusRoute } from '../types'

interface DriverToggleProps {
  isRouteActive: boolean
  activeRoute: BusRoute | null
}

/**
 * Non-interactive "LIVE" status badge shown on the map only while
 * a driver is actively broadcasting. All driver controls are in HamburgerMenu.
 */
export default function DriverToggle({ isRouteActive, activeRoute }: DriverToggleProps) {
  const { t } = useLang()
  if (!isRouteActive || !activeRoute) return null

  return (
    <div
      className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2 rounded-full pointer-events-none"
      style={{ background: '#1A1A1B', boxShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
    >
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          background: '#22c55e',
          boxShadow: '0 0 0 3px rgba(34,197,94,0.25)',
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      />
      <Navigation size={13} style={{ color: '#FFD700' }} />
      <span
        className="text-white font-bold text-xs tracking-wide"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {t('live_badge')} · {t('route')} {activeRoute.number}
      </span>
    </div>
  )
}
