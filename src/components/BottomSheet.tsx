import { useRef, useState, useCallback, useEffect } from 'react'
import { Bus, ChevronUp } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import type { BusRoute, VehicleLocation, LatLng } from '../types'
import { haversineMeters } from '../lib/lerp'

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
export const SHEET_H = HANDLE_H + HERO_H + CARD_H * 3 + 16
const COLLAPSED_VISIBLE = HANDLE_H + HERO_H + CARD_H
const COLLAPSED_OFFSET = SHEET_H - COLLAPSED_VISIBLE
const SNAP_THRESHOLD = 40

// City bus average speed: 25 km/h ≈ 6.94 m/s
const BUS_SPEED_MS = 25 / 3.6

function calcDistance(vehicle: VehicleLocation, refPos: LatLng | null): number {
  if (!refPos) return NaN
  return haversineMeters(vehicle.position, refPos)
}

function formatDistance(meters: number): string {
  if (isNaN(meters)) return ''
  if (meters < 1000) return `${Math.round(meters)} м`
  return `${(meters / 1000).toFixed(1)} км`
}

function calcEtaMinutes(distanceM: number): number {
  if (isNaN(distanceM)) return NaN
  return distanceM / BUS_SPEED_MS / 60
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
  const sheetRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const dragStartY = useRef(0)
  const baseOffset = useRef(COLLAPSED_OFFSET)
  const isDragging = useRef(false)
  const hasDragged = useRef(false)

  // Keep the --bs-visible CSS variable in sync so LocateMeButton tracks the sheet
  const updateCSSVar = (offset: number) => {
    document.documentElement.style.setProperty('--bs-visible', `${SHEET_H - offset}px`)
  }

  useEffect(() => {
    // Set initial value
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

          // Distance from bus to the reference point (searched address OR user GPS)
          const busDistM = calcDistance(vehicle, referencePosition)
          const etaMins = calcEtaMinutes(busDistM)

          // Sub-label for bus distance depends on context
          const busDistStr = formatDistance(busDistM)
          const distLabel = isSearchMode ? t('distance_to_dest') : t('distance_away')

          // Walk distance shown only on the recommended hero card when user searched
          const walkStr = walkDistanceM !== undefined ? formatDistance(walkDistanceM) : ''

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

                  {/* Walk distance to route (search mode) OR bus distance from reference */}
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

          // Regular cards
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
      </div>
    </div>
  )
}
