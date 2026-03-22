import { X, Route, Clock } from 'lucide-react'
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

function timeAgo(isoString: string, justNow: string, minAgo: string): string {
  const diffMin = (Date.now() - new Date(isoString).getTime()) / 60_000
  if (diffMin < 1) return justNow
  return `${Math.floor(diffMin)} ${minAgo}`
}

/**
 * Floating info card that slides up just above the bottom sheet when a bus
 * marker is tapped on the map or a card in the bottom sheet is pressed.
 * Uses the same white-card design language as the bottom sheet.
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
  const fare = route?.fare ?? 0

  return (
    <div
      className="absolute left-3 right-3 z-[1050]"
      style={{ bottom: 'calc(var(--bs-visible, 232px) + 12px)' }}
    >
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: '#ffffff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)',
        }}
      >
        {/* Route colour accent bar */}
        <div style={{ height: 5, background: routeColor }} />

        <div className="px-4 pt-3 pb-4">
          {/* ── Header row ── */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Route number badge */}
              <div
                className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: routeColor }}
              >
                <span
                  className="font-black text-xl leading-none"
                  style={{ color: '#fff', fontFamily: 'Inter, sans-serif' }}
                >
                  {vehicle.busNumber}
                </span>
              </div>

              <div className="min-w-0">
                <p
                  className="font-black text-base leading-tight truncate"
                  style={{ color: '#1A1A1B', fontFamily: 'Inter, sans-serif' }}
                >
                  {routeName}
                </p>
                {showShortId && (
                  <p
                    className="text-xs font-semibold mt-0.5"
                    style={{ color: routeColor }}
                  >
                    ID: #{shortId}
                  </p>
                )}
                {/* Last-updated row */}
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={11} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {t('updated_label')}: {updatedText}
                  </span>
                </div>
              </div>
            </div>

            {/* Dismiss button */}
            <button
              onClick={onDismiss}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ background: '#F3F4F6' }}
              aria-label={t('close')}
            >
              <X size={17} className="text-gray-500" />
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="mt-3 mb-3" style={{ height: 1, background: '#F3F4F6' }} />

          {/* ── Info chips row ── */}
          <div className="flex items-center gap-2 mb-3">
            {fare > 0 && (
              <div
                className="flex items-center gap-1 px-3 py-1.5 rounded-full"
                style={{ background: '#FFF9E6', border: '1.5px solid #FFD700' }}
              >
                <span
                  className="text-xs font-bold"
                  style={{ color: '#92700A', fontFamily: 'Inter, sans-serif' }}
                >
                  {fare} ₸
                </span>
              </div>
            )}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,0.7)' }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: '#15803d', fontFamily: 'Inter, sans-serif' }}
              >
                {t('live_badge')}
              </span>
            </div>
          </div>

          {/* ── Show Route button — full width, prominent ── */}
          <button
            onClick={onShowRoute}
            className="w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold text-sm active:opacity-80 transition-opacity"
            style={{
              background: routeColor,
              color: routeColor === '#FFD700' ? '#1A1A1B' : '#ffffff',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Route size={17} />
            {t('show_route')}
          </button>
        </div>
      </div>
    </div>
  )
}
