import { X, Path as Route } from '@phosphor-icons/react'
import { useLang } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import type { BusRoute, VehicleLocation } from '../types'

interface BusInfoCardProps {
  vehicle: VehicleLocation
  route: BusRoute | null
  /** When multiple buses share the same busNumber, show last-4 of UUID to distinguish */
  showShortId: boolean
  onDismiss: () => void
  onShowRoute: () => void
}

/**
 * Compact single-row pill that floats just above the bottom sheet when a bus
 * marker is tapped. Keeps the map unobstructed while still giving quick access
 * to the "Show Route" action.
 */
export default function BusInfoCard({
  vehicle,
  route,
  showShortId,
  onDismiss,
  onShowRoute,
}: BusInfoCardProps) {
  const { t } = useLang()
  const { tk } = useTheme()

  const routeColor = route?.color ?? '#2563EB'
  const routeName = route?.name ?? `${t('route')} ${vehicle.busNumber}`
  const shortId = vehicle.id.slice(-4)

  return (
    <div
      className="absolute left-3 right-3 z-[1050]"
      style={{ bottom: 'calc(var(--bs-visible, 232px) + 12px)' }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: tk.surfaceSolid,
          boxShadow: tk.shadow,
        }}
      >
        {/* Route colour accent bar */}
        <div style={{ height: 5, background: routeColor }} />

        {/* Single-row layout */}
        <div className="flex items-center gap-2.5 px-3" style={{ height: 55 }}>
          {/* Route number badge */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: routeColor }}
          >
            <span
              className="font-black text-base leading-none"
              style={{ color: '#fff', fontFamily: 'Inter, sans-serif' }}
            >
              {vehicle.busNumber}
            </span>
          </div>

          {/* Route name */}
          <div className="flex-1 min-w-0">
            <p
              className="font-black text-sm leading-tight truncate"
              style={{ color: tk.text, fontFamily: 'Inter, sans-serif' }}
            >
              {routeName}
            </p>
            {showShortId && (
              <p className="text-xs font-semibold" style={{ color: routeColor }}>
                #{shortId}
              </p>
            )}
          </div>

          {/* Compact Show Route button */}
          <button
            onClick={onShowRoute}
            className="flex-shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-full font-bold text-xs active:opacity-80 transition-opacity"
            style={{
              background: routeColor,
              color: routeColor === '#FFD700' ? '#1A1A1B' : '#ffffff',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Route size={14} />
            {t('show_route')}
          </button>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full active:scale-90 transition-transform"
            style={{ background: tk.border }}
            aria-label={t('close')}
          >
            <X size={16} style={{ color: tk.textSecondary }} />
          </button>
        </div>
      </div>
    </div>
  )
}
