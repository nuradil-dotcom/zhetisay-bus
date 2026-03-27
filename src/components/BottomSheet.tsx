import { useRef, useState, useCallback, useEffect } from 'react'
import { Bus, ChevronUp, MapPin } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import type { BusRoute, VehicleLocation, LatLng } from '../types'
import { haversineMeters } from '../lib/lerp'
import { ROUTE_WAYPOINTS } from '../lib/mockData'

interface NearbyItem {
  vehicle: VehicleLocation
  route: BusRoute
  /** True when this route is the closest to the searched address */
  isRecommended?: boolean
  /** Metres from the searched address to the nearest point on this route (hero card only) */
  walkDistanceM?: number
}

interface BottomSheetProps {
  items: NearbyItem[]
  selectedVehicleId: string | null
  /**
   * Point used for bus distance / ETA calculations.
   * App.tsx passes `searchLocation ?? userPosition` so ETA always reflects
   * "when does the bus reach my destination (or me)" correctly.
   */
  referencePosition: LatLng | null
  /** True when referencePosition is a searched address rather than user GPS */
  isSearchMode: boolean
  onSelect: (vehicleId: string, routeId: string) => void
  isLoading?: boolean
}

// ── Layout constants ────────────────────────────────────────────────────────
const CARD_H = 80
const HERO_H = 100
const HANDLE_H = 52
const WAYPOINTS_H = 104
export const SHEET_H = HANDLE_H + HERO_H + CARD_H * 3 + WAYPOINTS_H + 16
const COLLAPSED_VISIBLE = HANDLE_H + HERO_H + CARD_H
const COLLAPSED_OFFSET = SHEET_H - COLLAPSED_VISIBLE
const SNAP_THRESHOLD = 40

// City bus average speed: 25 km/h ≈ 6.94 m/s
const BUS_SPEED_MS = 25 / 3.6

function calcDistance(vehicle: VehicleLocation, refPos: LatLng | null): number {
  if (!refPos) return NaN
  return haversineMeters(vehicle.position, refPos)
}

function formatDistance(meters: number, meterAbbr: string, kmAbbr: string): string {
  if (isNaN(meters)) return ''
  if (meters < 1000) return `${Math.round(meters)} ${meterAbbr}`
  return `${(meters / 1000).toFixed(1)} ${kmAbbr}`
}

function calcEtaMinutes(distanceM: number): number {
  if (isNaN(distanceM)) return NaN
  return distanceM / BUS_SPEED_MS / 60
}

/** Next scheduled Route 2 departure from Bazaar, 20-min intervals starting 08:00. */
function nextDepartureFromBazaar(): string {
  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const startMin = 8 * 60
  const intervalMin = 20
  if (nowMin < startMin) return '08:00'
  const elapsed = nowMin - startMin
  const nextOffset = Math.ceil((elapsed + 1) / intervalMin) * intervalMin
  const nextMin = startMin + nextOffset
  if (nextMin >= 24 * 60) return '08:00'
  return `${String(Math.floor(nextMin / 60)).padStart(2, '0')}:${String(nextMin % 60).padStart(2, '0')}`
}

export default function BottomSheet({
  items,
  selectedVehicleId,
  referencePosition,
  isSearchMode,
  onSelect,
  isLoading = false,
}: BottomSheetProps) {
  const { t } = useLang()
  const isOnline = useOnlineStatus()
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null)

  const dragStartY = useRef(0)
  const baseOffset = useRef(COLLAPSED_OFFSET)
  const isDragging = useRef(false)
  const hasDragged = useRef(false)

  // Keep the --bs-visible CSS variable in sync so LocateMeButton tracks the sheet
  const updateCSSVar = (offset: number) => {
    document.documentElement.style.setProperty('--bs-visible', `${SHEET_H - offset}px`)
  }

  useEffect(() => {
    updateCSSVar(COLLAPSED_OFFSET)
  }, [])

  const snapTo = useCallback((targetOffset: number) => {
    if (!sheetRef.current) return
    sheetRef.current.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.1, 0.64, 1)'
    sheetRef.current.style.transform = `translateY(${targetOffset}px)`
    baseOffset.current = targetOffset
    setIsExpanded(targetOffset === 0)
    updateCSSVar(targetOffset)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    hasDragged.current = false
    dragStartY.current = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    if (sheetRef.current) sheetRef.current.style.transition = 'none'
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !sheetRef.current) return
    const delta = e.clientY - dragStartY.current
    if (Math.abs(delta) > 5) hasDragged.current = true
    const clamped = Math.max(0, Math.min(COLLAPSED_OFFSET, baseOffset.current + delta))
    sheetRef.current.style.transform = `translateY(${clamped}px)`
    updateCSSVar(clamped)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    isDragging.current = false
    const delta = e.clientY - dragStartY.current
    if (delta < -SNAP_THRESHOLD) snapTo(0)
    else if (delta > SNAP_THRESHOLD) snapTo(COLLAPSED_OFFSET)
    else snapTo(baseOffset.current)
  }

  const handleHandleTap = () => {
    if (hasDragged.current) return
    snapTo(isExpanded ? COLLAPSED_OFFSET : 0)
  }

  // Sort: recommended first, then by distance to referencePosition (NaN goes last)
  const sorted = [...items].sort((a, b) => {
    if (a.isRecommended && !b.isRecommended) return -1
    if (!a.isRecommended && b.isRecommended) return 1
    const dA = calcDistance(a.vehicle, referencePosition)
    const dB = calcDistance(b.vehicle, referencePosition)
    if (isNaN(dA) && isNaN(dB)) return 0
    if (isNaN(dA)) return 1
    if (isNaN(dB)) return -1
    return dA - dB
  })

  const formatEta = (etaMins: number): string => {
    if (isNaN(etaMins)) return '—'
    if (etaMins < 1) return t('less_than_1_min')
    return `${Math.round(etaMins)} ${t('min_abbr')}`
  }

  // ETA to a selected waypoint: use the first (closest) bus in `sorted`
  const selectedWaypoint = selectedWaypointId
    ? ROUTE_WAYPOINTS.find((w) => w.id === selectedWaypointId) ?? null
    : null

  const waypointEta = (() => {
    if (!isOnline || !selectedWaypoint || sorted.length === 0) return null
    const distM = haversineMeters(sorted[0].vehicle.position, selectedWaypoint.position)
    const mins = calcEtaMinutes(distM)
    return formatEta(mins)
  })()

  return (
    <div
      ref={sheetRef}
      className="absolute left-0 right-0 z-[1000] bg-[#F5F3EF] rounded-t-2xl shadow-2xl safe-bottom"
      style={{
        bottom: 0,
        height: `${SHEET_H}px`,
        transform: `translateY(${COLLAPSED_OFFSET}px)`,
        willChange: 'transform',
        touchAction: 'none',
      }}
    >
      {/* ── Drag handle zone ── */}
      <div
        className="flex flex-col items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing select-none"
        style={{ height: `${HANDLE_H}px` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClick={handleHandleTap}
      >
        <div className="rounded-full" style={{ width: 56, height: 5, background: 'rgba(0,0,0,0.18)' }} />
        {!isExpanded && (
          <div className="flex items-center gap-1 text-gray-400 pointer-events-none">
            <ChevronUp size={14} />
            <span className="text-xs font-medium">{t('swipe_for_more')}</span>
          </div>
        )}
      </div>

      {/* ── Card list ── */}
      <div className="overflow-hidden" style={{ height: `${SHEET_H - HANDLE_H}px` }}>

        {/* Loading skeleton */}
        {isLoading && (
          <>
            <div className="flex items-center gap-3 px-4" style={{ height: `${HERO_H}px` }}>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded-full animate-pulse w-28" />
                <div className="h-3 bg-gray-100 rounded-full animate-pulse w-20" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-5 bg-gray-100 rounded-full animate-pulse w-14" />
                <div className="h-3 bg-gray-100 rounded-full animate-pulse w-20" />
              </div>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4" style={{ height: `${CARD_H}px` }}>
                <div className="w-11 h-11 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded-full animate-pulse w-24" />
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-16" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse w-12" />
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-16" />
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-2"
            style={{ height: `${HERO_H + CARD_H}px` }}
          >
            <Bus size={32} className="text-gray-300" />
            <p className="text-gray-400 font-medium text-base text-center px-8">
              {t('no_routes')}
            </p>
          </div>
        )}

        {/* Bus cards */}
        {!isLoading && sorted.map(({ vehicle, route, isRecommended, walkDistanceM }, index) => {
          const isHero = index === 0
          const isSelected = vehicle.id === selectedVehicleId

          const busDistM = calcDistance(vehicle, referencePosition)
          const etaMins = calcEtaMinutes(busDistM)
          const busDistStr = formatDistance(busDistM, t('meter_abbr'), t('km_abbr'))
          const distLabel = isSearchMode ? t('distance_to_dest') : t('distance_away')
          const walkStr =
            walkDistanceM !== undefined
              ? formatDistance(walkDistanceM, t('meter_abbr'), t('km_abbr'))
              : ''

          if (isHero) {
            return (
              <button
                key={vehicle.id}
                onClick={() => onSelect(vehicle.id, route.id)}
                className="w-full flex items-center gap-4 px-4 text-left active:opacity-90 transition-opacity"
                style={{
                  height: `${HERO_H}px`,
                  background: isSelected ? '#2563EB' : '#FFD700',
                }}
              >
                <div
                  className="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center"
                  style={{ background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}
                >
                  <Bus size={28} color={isSelected ? 'white' : '#1A1A1B'} />
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                    style={{ color: isSelected ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.55)' }}
                  >
                    {isRecommended ? t('recommended_route') : t('nearest_bus')}
                  </p>
                  <p
                    className="font-black text-xl leading-tight truncate"
                    style={{ color: isSelected ? 'white' : '#1A1A1B', fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('route')} {route.number}
                  </p>

                  {walkStr ? (
                    <p
                      className="text-xs font-medium mt-0.5"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.45)' }}
                    >
                      🚶 {walkStr} {t('walk_to_route')}
                    </p>
                  ) : busDistStr ? (
                    <p
                      className="text-xs font-medium mt-0.5"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.45)' }}
                    >
                      {busDistStr} {distLabel}
                    </p>
                  ) : null}
                </div>

                <div className="flex-shrink-0 text-right">
                  <p
                    className="font-black text-3xl leading-none"
                    style={{ color: isSelected ? 'white' : '#1A1A1B', fontFamily: 'Inter, sans-serif' }}
                  >
                    {formatEta(etaMins)}
                  </p>
                  {!isNaN(etaMins) && (
                    <p
                      className="text-xs font-semibold mt-1"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.5)' }}
                    >
                      {t('arriving_time')}
                    </p>
                  )}
                </div>
              </button>
            )
          }

          return (
            <button
              key={vehicle.id}
              onClick={() => onSelect(vehicle.id, route.id)}
              className={`w-full flex items-center gap-3 px-4 text-left transition-colors active:opacity-80 border-t border-gray-50 ${
                isSelected ? 'bg-blue-600' : 'bg-white hover:bg-gray-50'
              }`}
              style={{ height: `${CARD_H}px` }}
            >
              <div
                className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center ${
                  isSelected ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                <Bus size={22} color={isSelected ? 'white' : '#374151'} />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-bold text-base leading-tight truncate ${
                    isSelected ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {t('route')} {route.number}
                </p>
                <p className={`text-sm mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                  {busDistStr ? `${busDistStr} ${distLabel}` : t('nearby')}
                </p>
              </div>

              <div className="flex-shrink-0 text-right">
                <p
                  className={`font-bold text-base leading-tight ${
                    isSelected ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {formatEta(etaMins)}
                </p>
                {!isNaN(etaMins) && (
                  <p className={`text-sm mt-0.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                    {t('arriving_time')}
                  </p>
                )}
              </div>
            </button>
          )
        })}

        {/* ── Waypoints section (visible when fully expanded) ── */}
        <div
          className="border-t border-gray-100 px-4"
          style={{ height: `${WAYPOINTS_H}px` }}
        >
          {/* Section header */}
          <div className="flex items-center gap-1.5 pt-2.5 pb-2">
            <MapPin size={12} className="text-gray-400 flex-shrink-0" />
            <span
              className="text-[10px] font-bold uppercase tracking-widest text-gray-400"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {t('waypoints')}
            </span>
          </div>

          {/* Waypoint pills row */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {ROUTE_WAYPOINTS.map((wp) => {
              const isActive = selectedWaypointId === wp.id
              return (
                <button
                  key={wp.id}
                  onClick={() => setSelectedWaypointId(isActive ? null : wp.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: isActive ? '#16a34a' : '#F3F4F6',
                    color: isActive ? '#fff' : '#374151',
                    fontFamily: 'Inter, sans-serif',
                    border: isActive ? '1.5px solid #15803d' : '1.5px solid transparent',
                  }}
                >
                  {wp.name}
                </button>
              )
            })}
          </div>

          {/* ETA / timetable display */}
          {selectedWaypoint && (
            <div className="mt-2 flex items-center gap-2">
              {isOnline && sorted.length > 0 ? (
                <>
                  <span
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: '#F0FDF4', color: '#15803d', border: '1px solid #86EFAC' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 4px rgba(34,197,94,0.8)' }} />
                    {t('live_badge')}
                  </span>
                  <span
                    className="text-xs font-semibold text-gray-700"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {selectedWaypoint.name}:
                  </span>
                  <span
                    className="text-sm font-black text-gray-900"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {waypointEta ?? '—'}
                  </span>
                </>
              ) : (
                <span
                  className="text-xs font-medium text-gray-500"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {`${t('next_departure_bazaar')}: ${nextDepartureFromBazaar()}`}
                </span>
              )}
            </div>
          )}
          {!selectedWaypoint && !isOnline && (
            <div className="mt-2">
              <span
                className="text-xs font-medium text-gray-500"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {t('next_departure_bazaar')}: {nextDepartureFromBazaar()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
