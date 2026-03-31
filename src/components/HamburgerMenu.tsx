import { useEffect, useState } from 'react'
import { X, Navigation, NavigationOff, Bus, Info, MapPin, ChevronDown, ChevronUp, Download } from 'lucide-react'
import { useLang, LANG_LABELS } from '../context/LanguageContext'
import type { Lang } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import type { BusRoute, VehicleLocation } from '../types'
import { ROUTE_WAYPOINTS_BY_ROUTE_ID } from '../lib/mockData'

interface HamburgerMenuProps {
  isOpen: boolean
  onClose: () => void
  isDriverMode: boolean
  isRouteActive: boolean
  authenticatedBusNumber: string | null
  routes: BusRoute[]
  vehicles: VehicleLocation[]
  onEnterDriverMode: () => void
  onStartRoute: () => void
  onStopRoute: () => void
  /** Called when user picks a route from the routes panel */
  onRouteSelect: (routeId: string) => void
  /** Waypoint from Stops menu: show route, fit bounds, then center map on the stop */
  onStopsWaypointSelect: (routeId: string, lat: number, lng: number) => void
  onOpenInstallTutorial: () => void
}

export default function HamburgerMenu({
  isOpen,
  onClose,
  isDriverMode,
  isRouteActive,
  authenticatedBusNumber,
  routes,
  vehicles,
  onEnterDriverMode,
  onStartRoute,
  onStopRoute,
  onRouteSelect,
  onStopsWaypointSelect,
  onOpenInstallTutorial,
}: HamburgerMenuProps) {
  const { lang, setLang, t } = useLang()
  const { theme, setTheme } = useTheme()
  const [routesExpanded, setRoutesExpanded] = useState(false)
  /** Which route’s waypoint list is open under Stops (only one at a time) */
  const [expandedStopsRouteId, setExpandedStopsRouteId] = useState<string | null>(null)
  const [isStandaloneMode, setIsStandaloneMode] = useState(false)

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Close routes accordion when drawer is closed
  useEffect(() => {
    if (!isOpen) {
      setRoutesExpanded(false)
      setExpandedStopsRouteId(null)
    }
  }, [isOpen])

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)')
    const updateMode = () => {
      const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
      setIsStandaloneMode(media.matches || iosStandalone)
    }
    updateMode()
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', updateMode)
      return () => media.removeEventListener('change', updateMode)
    }
    media.addListener(updateMode)
    return () => media.removeListener(updateMode)
  }, [])

  const handleDriverClick = () => {
    if (!isDriverMode) {
      onClose()
      setTimeout(onEnterDriverMode, 220)
    }
  }

  const handleRouteClick = (routeId: string) => {
    onRouteSelect(routeId)
    setRoutesExpanded(false)
    onClose()
  }

  const handleStopsRouteHeaderClick = (routeId: string) => {
    setExpandedStopsRouteId((prev) => (prev === routeId ? null : routeId))
  }

  const handleStopsWaypointClick = (routeId: string, lat: number, lng: number) => {
    setExpandedStopsRouteId(null)
    onStopsWaypointSelect(routeId, lat, lng)
  }

  const routesForStops = [...routes].sort(
    (a, b) => Number(a.number) - Number(b.number) || a.id.localeCompare(b.id)
  )

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[1500] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(2px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 bottom-0 z-[1600] flex flex-col"
        style={{
          width: 'min(84vw, 320px)',
          background: '#1A1A1B',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '8px 0 40px rgba(0,0,0,0.6)' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-14 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img
              src="/pwa-512.png"
              alt="Zholda logo"
              className="w-9 h-9 rounded-xl object-cover flex-shrink-0"
            />
            <div>
              <p className="text-white text-base leading-tight font-revalia">Zholda</p>
              <p className="text-gray-500 text-xs">Zholda, 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full active:opacity-60"
            style={{ background: 'rgba(255,255,255,0.08)' }}
            aria-label={t('close')}
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-5 px-5 space-y-6">

          {/* ── Language switcher ── */}
          <section>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
              {t('language_section')}
            </p>
            <div className="flex gap-2">
              {(['kz', 'ru', 'en'] as Lang[]).map((l) => {
                const isActive = lang === l
                return (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="flex-1 flex flex-col items-center py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                    style={{
                      background: isActive ? '#FFD700' : 'rgba(255,255,255,0.07)',
                      color: isActive ? '#1A1A1B' : '#F5F5F7',
                      border: isActive ? '2px solid #FFD700' : '2px solid transparent',
                    }}
                  >
                    <span className="text-base font-black leading-tight">
                      {LANG_LABELS[l].short}
                    </span>
                    <span className="text-[10px] mt-0.5 opacity-80 font-medium">
                      {LANG_LABELS[l].full}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Theme switcher ── */}
          <section>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
              {t('theme_section')}
            </p>
            <div className="flex gap-2">
              {(['light', 'dark'] as const).map((th) => {
                const isActive = theme === th
                const label = th === 'light' ? t('theme_light') : t('theme_dark')
                const emoji = th === 'light' ? '☀️' : '🌙'
                return (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className="flex-1 flex flex-col items-center py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                    style={{
                      background: isActive ? '#FFD700' : 'rgba(255,255,255,0.07)',
                      color: isActive ? '#1A1A1B' : '#F5F5F7',
                      border: isActive ? '2px solid #FFD700' : '2px solid transparent',
                    }}
                  >
                    <span className="text-base leading-tight">{emoji}</span>
                    <span className="text-[10px] mt-0.5 opacity-80 font-medium">{label}</span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* ── Driver mode ── */}
          <section>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
              {t('driver_section')}
            </p>

            {!isDriverMode ? (
              <button
                onClick={handleDriverClick}
                className="w-full flex items-center gap-3 px-4 rounded-xl transition-opacity active:opacity-70"
                style={{ background: 'rgba(255,255,255,0.07)', minHeight: '56px' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,215,0,0.15)' }}
                >
                  <Navigation size={18} style={{ color: '#FFD700' }} />
                </div>
                <div className="flex-1 text-left">
                  <p
                    className="font-semibold text-sm"
                    style={{ color: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('driver_login_label')}
                  </p>
                  <p className="text-gray-500 text-xs">{t('driver_pin_required')}</p>
                </div>
                <span className="text-gray-600 text-lg leading-none">›</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,215,0,0.12)' }}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background: isRouteActive ? '#22c55e' : '#FFD700',
                      boxShadow: isRouteActive ? '0 0 6px #22c55e' : 'none',
                    }}
                  />
                  <div>
                    <p
                      className="font-bold text-sm"
                      style={{ color: '#FFD700', fontFamily: 'Inter, sans-serif' }}
                    >
                      {isRouteActive ? t('broadcasting_active') : t('driver_mode_active')}
                    </p>
                    {authenticatedBusNumber && (
                      <p className="text-gray-400 text-xs">
                        {t('route')} {authenticatedBusNumber}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={isRouteActive ? onStopRoute : onStartRoute}
                  className="w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-opacity active:opacity-80"
                  style={{
                    background: isRouteActive ? '#ef4444' : '#FFD700',
                    color: isRouteActive ? 'white' : '#1A1A1B',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {isRouteActive ? (
                    <><NavigationOff size={20} /> {t('stop_route')}</>
                  ) : (
                    <><Navigation size={20} /> {t('start_route')}</>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* ── Navigation ── */}
          <section>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
              {t('navigation_section')}
            </p>
            <div className="space-y-1">

              {/* ── All routes (expandable accordion) ── */}
              <div>
                <button
                  onClick={() => setRoutesExpanded((v) => !v)}
                  className="w-full flex items-center gap-3 px-4 rounded-xl transition-opacity active:opacity-70"
                  style={{ background: 'rgba(255,255,255,0.04)', minHeight: '52px' }}
                >
                  <span className="text-gray-400 flex-shrink-0">
                    <MapPin size={18} />
                  </span>
                  <p
                    className="flex-1 font-medium text-sm text-left"
                    style={{ color: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('all_routes')}
                  </p>
                  {routesExpanded
                    ? <ChevronUp size={16} className="text-gray-500 flex-shrink-0" />
                    : <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                  }
                </button>

                {/* Routes list (expands below the button) */}
                {routesExpanded && (
                  <div
                    className="mx-1 mt-1 mb-1 rounded-xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    {routes.map((route) => {
                      const activeCount = vehicles.filter(
                        (v) => v.busNumber === route.number && v.isActive
                      ).length
                      const totalCount = vehicles.filter(
                        (v) => v.busNumber === route.number
                      ).length

                      return (
                        <button
                          key={route.id}
                          onClick={() => handleRouteClick(route.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 transition-opacity active:opacity-70 border-b border-white/5 last:border-b-0"
                        >
                          {/* Route colour dot */}
                          <span
                            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                            style={{
                              background: route.color,
                              color: '#fff',
                              fontFamily: 'Inter, sans-serif',
                            }}
                          >
                            {route.number}
                          </span>

                          <div className="flex-1 text-left min-w-0">
                            <p
                              className="font-semibold text-sm truncate"
                              style={{ color: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}
                            >
                              {route.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {activeCount > 0
                                ? `${activeCount} ${t('buses_active')}`
                                : `${totalCount} ${t('buses_active')}`
                              }
                            </p>
                          </div>

                          <span className="text-gray-600 text-base leading-none flex-shrink-0">›</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Stops — per-route accordion (waypoints from mockData) */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 px-1 pb-1">
                  <Bus size={14} className="text-gray-500 flex-shrink-0" />
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest text-gray-500"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    {t('bus_stops')}
                  </p>
                </div>

                {routesForStops.map((route) => {
                  const waypoints = ROUTE_WAYPOINTS_BY_ROUTE_ID[route.id] ?? []
                  const isStopsRouteOpen = expandedStopsRouteId === route.id

                  return (
                    <div key={route.id}>
                      <button
                        type="button"
                        onClick={() => handleStopsRouteHeaderClick(route.id)}
                        className="w-full flex items-center gap-3 px-4 rounded-xl transition-opacity active:opacity-70"
                        style={{ background: 'rgba(255,255,255,0.04)', minHeight: '52px' }}
                      >
                        <span
                          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                          style={{
                            background: route.color,
                            color: '#fff',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {route.number}
                        </span>
                        <p
                          className="flex-1 font-medium text-sm text-left truncate"
                          style={{ color: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}
                        >
                          {t('route')} {route.number}
                        </p>
                        {isStopsRouteOpen
                          ? <ChevronUp size={16} className="text-gray-500 flex-shrink-0" />
                          : <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                        }
                      </button>

                      {isStopsRouteOpen && waypoints.length > 0 && (
                        <div
                          className="mx-1 mt-1 mb-1 rounded-xl overflow-hidden"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                        >
                          {waypoints.map((waypoint) => (
                            <button
                              type="button"
                              key={waypoint.id}
                              onClick={() =>
                                handleStopsWaypointClick(
                                  route.id,
                                  waypoint.position.lat,
                                  waypoint.position.lng
                                )
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 transition-opacity active:opacity-70 border-b border-white/5 last:border-b-0"
                            >
                              <span
                                className="w-6 h-6 rounded-full flex-shrink-0"
                                style={{ background: 'rgba(255,215,0,0.18)' }}
                              />
                              <p
                                className="flex-1 font-medium text-sm text-left truncate"
                                style={{ color: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}
                              >
                                {waypoint.name}
                              </p>
                              <span className="text-gray-600 text-base leading-none flex-shrink-0">›</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Help */}
              <button
                className="w-full flex items-center gap-3 px-4 rounded-xl transition-opacity active:opacity-70"
                style={{ background: 'rgba(255,255,255,0.04)', minHeight: '52px' }}
              >
                <span className="text-gray-400 flex-shrink-0"><Info size={18} /></span>
                <p
                  className="font-medium text-sm"
                  style={{ color: '#F5F5F7', fontFamily: 'Inter, sans-serif' }}
                >
                  {t('help')}
                </p>
              </button>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10">
          {!isStandaloneMode && (
            <button
              onClick={() => {
                onOpenInstallTutorial()
                onClose()
              }}
              className="w-full h-14 rounded-2xl font-bold text-sm text-black mb-3 flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
              style={{ background: '#FFD700', fontFamily: 'Inter, sans-serif' }}
            >
              <Download size={16} />
              {t('install_app')}
            </button>
          )}
          <p className="text-gray-600 text-xs text-center">
            © 2026 Zholda · {t('city_name')}
          </p>
        </div>
      </div>
    </>
  )
}
