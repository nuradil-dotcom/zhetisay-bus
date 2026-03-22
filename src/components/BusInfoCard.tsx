import { X, Route } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import type { BusRoute, VehicleLocation } from '../types'

interface BusInfoCardProps {
  vehicle: VehicleLocation
  route: BusRoute | null
  /** When multiple buses share the same busNumber, show last-4 of UUID to distinguish */
  showShortId: boolean
  onDismiss: () => void
  onShowRoute: () => void
}

/** Formats the time elapsed since an ISO timestamp. */
function timeAgo(isoString: string, justNow: string, minAgo: string): string {
  const diffMin = (Date.now() - new Date(isoString).getTime()) / 60_000
  if (diffMin < 1) return justNow
  return `${Math.floor(diffMin)} ${minAgo}`
}

/**
 * Floating info card that slides up just above the bottom sheet when a bus marker
 * is tapped on the map. Shows route badge, optional short bus ID, and last GPS update.
 */
export default function BusInfoCard({
  vehicle,
  route,
  showShortId,
  onDismiss,
  onShowRoute,
}: BusInfoCardProps) {
  const { t } = useLang()

  const routeColor = route?.color ?? '#2563EB'
  const routeName = route?.name ?? `${t('route')} ${vehicle.busNumber}`
  const shortId = vehicle.id.slice(-4)
  const updatedText = timeAgo(vehicle.updatedAt, t('just_now'), t('min_ago'))

  return (
    <div
      className="absolute left-3 right-3 z-[1050]"
      style={{ bottom: 'calc(var(--bs-visible, 232px) + 12px)' }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#1A1A1B',
          border: `2px solid ${routeColor}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)`,
        }}
      >
        {/* Route colour bar */}
        <div style={{ height: 4, background: routeColor }} />

        <div className="px-4 pt-3 pb-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {/* Route badge */}
              <span
                className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg font-black text-base"
                style={{ background: routeColor, color: '#1A1A1B', fontFamily: 'Inter, sans-serif' }}
              >
                {vehicle.busNumber}
              </span>

              <div className="min-w-0">
                <p
                  className="font-bold text-sm leading-tight truncate"
                  style={{ color: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}
                >
                  {routeName}
                </p>
                {showShortId && (
                  <p className="text-xs mt-0.5" style={{ color: routeColor }}>
                    #{shortId}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onDismiss}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full active:opacity-60"
              style={{ background: 'rgba(255,255,255,0.08)' }}
              aria-label={t('close')}
            >
              <X size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Metadata row */}
          <div className="flex items-center justify-between mt-3 gap-3">
            <p className="text-xs text-gray-500">
              <span className="text-gray-400">{t('updated_label')}: </span>
              {updatedText}
            </p>

            {/* Show route button */}
            <button
              onClick={onShowRoute}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold active:opacity-70 transition-opacity flex-shrink-0"
              style={{
                background: routeColor,
                color: '#1A1A1B',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <Route size={13} />
              {t('show_route')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
