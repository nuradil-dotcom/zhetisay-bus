import { useState, useCallback, useEffect } from 'react'
import type { LatLngBoundsExpression } from 'leaflet'
import { RotateCcw } from 'lucide-react'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import BottomSheet from './components/BottomSheet'
import DriverToggle from './components/DriverToggle'
import DriverPINModal from './components/DriverPINModal'
import DriverModeScreen from './components/DriverModeScreen'
import HamburgerMenu from './components/HamburgerMenu'
import InstallButton from './components/InstallButton'
import OnboardingModal from './components/OnboardingModal'
import UpdateBanner from './components/UpdateBanner'
import OfflineIndicator from './components/OfflineIndicator'
import SplashScreen from './components/SplashScreen'
import LocateMeButton from './components/LocateMeButton'
import BusInfoCard from './components/BusInfoCard'
import { LanguageProvider, useLang } from './context/LanguageContext'
import { useGeolocation } from './hooks/useGeolocation'
import { useVehicles } from './hooks/useVehicles'
import { useDeviceHeading } from './hooks/useDeviceHeading'
import { authenticateDriver } from './lib/supabase'
import { haversineMeters } from './lib/lerp'
import { MOCK_ROUTES } from './lib/mockData'
import type { BusRoute, DriverAuth, LatLng, VehicleLocation } from './types'

// ── Utilities ─────────────────────────────────────────────────────────────────

function findClosestRoute(
  point: LatLng,
  routes: BusRoute[],
  vehicles: VehicleLocation[]
): { routeId: string; vehicleId: string | null; distanceToRoute: number } | null {
  let bestRouteId: string | null = null
  let bestVehicleId: string | null = null
  let bestDist = Infinity

  for (const route of routes) {
    if (!route.geojson) continue
    for (const feature of route.geojson.features) {
      if (feature.geometry.type !== 'LineString') continue
      const coords = feature.geometry.coordinates as [number, number][]
      for (const [lng, lat] of coords) {
        const d = haversineMeters(point, { lat, lng })
        if (d < bestDist) {
          bestDist = d
          bestRouteId = route.id
          const v = vehicles.find((veh) => veh.busNumber === route.number)
          bestVehicleId = v?.id ?? null
        }
      }
    }
  }

  if (!bestRouteId) return null
  return { routeId: bestRouteId, vehicleId: bestVehicleId, distanceToRoute: bestDist }
}

/** Compute the [[minLat, minLng], [maxLat, maxLng]] bounding box for a route. */
function routeBounds(route: BusRoute): LatLngBoundsExpression | null {
  if (!route.geojson) return null
  const coords: number[][] = []
  for (const f of route.geojson.features) {
    if (f.geometry.type === 'LineString') {
      coords.push(...(f.geometry.coordinates as number[][]))
    }
  }
  if (!coords.length) return null
  const lats = coords.map((c) => c[1])
  const lngs = coords.map((c) => c[0])
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

// ── App inner ─────────────────────────────────────────────────────────────────

function AppInner() {
  const { t } = useLang()
  const [splashDone, setSplashDone] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showPINModal, setShowPINModal] = useState(false)
  const [isDriverMode, setIsDriverMode] = useState(false)
  const [isRouteActive, setIsRouteActive] = useState(false)

  const [driverAuth, setDriverAuth] = useState<DriverAuth | null>(null)
  const [routes] = useState<BusRoute[]>(MOCK_ROUTES)

  const { vehicles, isLoading, error } = useVehicles()

  // ── Map state ─────────────────────────────────────────────────────────────
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null)
  const [recommendedRouteId, setRecommendedRouteId] = useState<string | null>(null)
  const [searchLocation, setSearchLocation] = useState<LatLng | null>(null)
  /** Minimum distance (metres) from searched address to nearest point on the recommended route */
  const [searchWalkDistance, setSearchWalkDistance] = useState<number | null>(null)
  const [flyToTarget, setFlyToTarget] = useState<LatLng | null>(null)
  const [fitBoundsTarget, setFitBoundsTarget] = useState<LatLngBoundsExpression | null>(null)

  // ── Locate me ─────────────────────────────────────────────────────────────
  const [userPosition, setUserPosition] = useState<LatLng | null>(null)
  const [userAccuracy, setUserAccuracy] = useState(40)
  const [isLocating, setIsLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  // Find the driver's route GeoJSON so useGeolocation can snap GPS to the road
  const driverRouteGeojson =
    driverAuth
      ? (routes.find((r) => r.number === driverAuth.busNumber)?.geojson ?? null)
      : null

  const geo = useGeolocation(driverAuth?.vehicleId ?? null, driverRouteGeojson)
  const deviceHeading = useDeviceHeading()

  // If the GPS watcher stops due to a fatal error (e.g. permission denied) while
  // the driver thinks the route is active, reset isRouteActive to keep UI in sync.
  useEffect(() => {
    if (isRouteActive && !geo.isWatching && geo.error) {
      setIsRouteActive(false)
    }
  }, [geo.isWatching, geo.error, isRouteActive])

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Returns the BusRoute for a given vehicle (or a synthetic one). */
  const routeForVehicle = useCallback(
    (v: VehicleLocation): BusRoute => {
      return (
        routes.find((r) => r.id === v.busNumber || r.number === v.busNumber) ?? {
          id: v.id,
          name: `Маршрут ${v.busNumber}`,
          number: v.busNumber,
          color: '#2563EB',
          geojson: null,
          fare: 0,
        }
      )
    },
    [routes]
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLocateMe = useCallback(() => {
    // Second tap when already located → deactivate (remove dot, turn button white)
    if (userPosition) {
      setUserPosition(null)
      return
    }

    if (!('geolocation' in navigator)) {
      setLocateError(t('location_unavailable'))
      setTimeout(() => setLocateError(null), 4000)
      return
    }
    setIsLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: LatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPosition(loc)
        setUserAccuracy(pos.coords.accuracy)
        setFlyToTarget(loc)
        setFitBoundsTarget(null)
        setIsLocating(false)
        // On iOS 13+, request compass permission in the same user-gesture context
        if (deviceHeading.permissionState === 'needs_request') {
          deviceHeading.requestPermission()
        }
      },
      (err) => {
        setIsLocating(false)
        const msg =
          err.code === 1
            ? t('location_permission_denied')
            : t('location_unavailable')
        setLocateError(msg)
        setTimeout(() => setLocateError(null), 5000)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    )
  }, [userPosition, t])

  const handleLocationSelect = useCallback(
    (lat: number, lng: number, _name: string) => {
      const loc: LatLng = { lat, lng }
      setSearchLocation(loc)
      setFlyToTarget(loc)
      setFitBoundsTarget(null)

      const rec = findClosestRoute(loc, routes, vehicles)
      if (rec) {
        setRecommendedRouteId(rec.routeId)
        setActiveRouteId(rec.routeId)
        setSearchWalkDistance(rec.distanceToRoute)
        if (rec.vehicleId) setSelectedVehicleId(rec.vehicleId)
      } else {
        setSearchWalkDistance(null)
      }
    },
    [routes, vehicles]
  )

  /** Tap a bus marker on the map → show info card + highlight route */
  const handleBusClick = useCallback(
    (vehicleId: string) => {
      if (selectedVehicleId === vehicleId) {
        // Second tap deselects
        setSelectedVehicleId(null)
        setActiveRouteId(null)
        return
      }
      const v = vehicles.find((veh) => veh.id === vehicleId)
      if (!v) return
      const route = routeForVehicle(v)
      setSelectedVehicleId(vehicleId)
      setActiveRouteId(route.id)
      setRecommendedRouteId(null)
      // Fly to bus position
      setFlyToTarget({ lat: v.position.lat + 0.001, lng: v.position.lng })
      setFitBoundsTarget(null)
    },
    [selectedVehicleId, vehicles, routeForVehicle]
  )

  /** Tap "Show route" on the info card → fit map to full route extent */
  const handleShowRouteFromCard = useCallback(() => {
    if (!activeRouteId) return
    // Cancel any in-progress flyTo immediately so fitBounds can take over cleanly.
    setFlyToTarget(null)
    const route = routes.find((r) => r.id === activeRouteId)
    if (!route) return
    const bounds = routeBounds(route)
    if (bounds) {
      setFitBoundsTarget(bounds)
    }
  }, [activeRouteId, routes])

  /** BottomSheet card tap → select bus + show its route */
  const handleSelectBus = useCallback(
    (vehicleId: string, routeId: string) => {
      const isSame = selectedVehicleId === vehicleId
      setSelectedVehicleId(isSame ? null : vehicleId)
      setActiveRouteId(isSame ? null : routeId)
      setRecommendedRouteId(null)
    },
    [selectedVehicleId]
  )

  /** "All routes" menu → draw route + fit map bounds */
  const handleRouteSelect = useCallback(
    (routeId: string) => {
      const route = routes.find((r) => r.id === routeId)
      if (!route) return
      setActiveRouteId(routeId)
      setSelectedVehicleId(null)
      setRecommendedRouteId(null)
      const bounds = routeBounds(route)
      if (bounds) {
        setFitBoundsTarget(bounds)
        setFlyToTarget(null)
      }
    },
    [routes]
  )

  /** Clears all map overlays (route polyline, search pin, selection, walk-distance info) */
  const handleClearMap = useCallback(() => {
    setActiveRouteId(null)
    setSelectedVehicleId(null)
    setRecommendedRouteId(null)
    setSearchLocation(null)
    setSearchWalkDistance(null)
    setFitBoundsTarget(null)
    setFlyToTarget(null)
  }, [])

  const handleEnterDriverMode = () => setShowPINModal(true)

  const handlePINSuccess = (auth: DriverAuth) => {
    setDriverAuth(auth)
    setShowPINModal(false)
    setIsDriverMode(true)
  }

  const handleStartRoute = () => {
    setIsRouteActive(true)
    geo.startWatching()
    setMenuOpen(false)
  }

  const handleStopRoute = () => {
    setIsRouteActive(false)
    geo.stopWatching()
  }

  const handleExitDriverMode = () => {
    if (isRouteActive) {
      setIsRouteActive(false)
      geo.stopWatching()
    }
    setDriverAuth(null)
    setIsDriverMode(false)
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  // referencePosition: the point used for bus distance / ETA calculations.
  // When the user searched an address, distances are relative to that destination.
  // Fallback to GPS position when no search has been made.
  const referencePosition = searchLocation ?? userPosition

  // The Clear button appears whenever there is something on the map beyond bus dots
  const mapHasOverlays = activeRouteId !== null || searchLocation !== null

  const nearbyItems = vehicles.map((v) => {
    const route = routeForVehicle(v)
    const isRecommended = recommendedRouteId ? route.id === recommendedRouteId : false
    return {
      vehicle: v,
      route,
      isRecommended,
      // Walking distance from the searched point to the nearest stop on this route.
      // Only set for the recommended item so it shows in the hero card.
      walkDistanceM:
        isRecommended && searchWalkDistance !== null ? searchWalkDistance : undefined,
    }
  })

  const driverRoute: BusRoute | null = driverAuth
    ? (routes.find((r) => r.number === driverAuth.busNumber) ?? {
        id: driverAuth.vehicleId,
        name: `Маршрут ${driverAuth.busNumber}`,
        number: driverAuth.busNumber,
        color: '#FFD700',
        geojson: null,
        fare: 0,
      })
    : null

  // Find the selected vehicle + its route for the info card
  const selectedVehicle = selectedVehicleId
    ? vehicles.find((v) => v.id === selectedVehicleId) ?? null
    : null
  const selectedRoute = selectedVehicle ? routeForVehicle(selectedVehicle) : null

  // Determine if "twin" buses exist (same busNumber → show short ID to distinguish)
  const twinExists = selectedVehicle
    ? vehicles.filter((v) => v.busNumber === selectedVehicle.busNumber).length > 1
    : false

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: '#1A1A1B' }}>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}

      {/* ── Driver Mode ── */}
      {isDriverMode && (
        <DriverModeScreen
          busNumber={driverAuth?.busNumber ?? '?'}
          isRouteActive={isRouteActive}
          gpsPosition={geo.position}
          gpsAccuracy={geo.accuracy}
          lastUploadAt={geo.lastUploadAt}
          gpsError={geo.error}
          onStartRoute={handleStartRoute}
          onStopRoute={handleStopRoute}
          onExitDriverMode={handleExitDriverMode}
          onMenuClick={() => setMenuOpen(true)}
        />
      )}

      {/* ── Passenger Mode ── */}
      {!isDriverMode && (
        <>
          <MapView
            routes={routes}
            vehicles={vehicles}
            activeRouteId={activeRouteId}
            selectedVehicleId={selectedVehicleId}
            userPosition={userPosition}
            userAccuracy={userAccuracy}
            userHeading={deviceHeading.heading}
            flyToTarget={flyToTarget}
            fitBoundsTarget={fitBoundsTarget}
            searchLocation={searchLocation}
            onBusClick={handleBusClick}
          />

          {isLoading && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2 bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
              <span className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse" />
              Автобустар жүктелуде…
            </div>
          )}

          {error && !isLoading && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2 bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none max-w-xs text-center">
              ⚠ {error}
            </div>
          )}

          <SearchBar
            onMenuClick={() => setMenuOpen(true)}
            onLocationSelect={handleLocationSelect}
          />
          <OfflineIndicator />
          <DriverToggle isRouteActive={isRouteActive} activeRoute={driverRoute} />
          <LocateMeButton
            onClick={handleLocateMe}
            isActive={!!userPosition}
            isLoading={isLocating}
          />

          {/* Location error toast — appears above the locate button, auto-dismisses */}
          {locateError && (
            <div
              className="absolute left-4 z-[1001] flex items-center gap-2 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-2xl shadow-xl max-w-[260px]"
              style={{ bottom: 'calc(var(--bs-visible, 232px) + 60px)' }}
            >
              <span className="text-red-400 flex-shrink-0">⚠</span>
              <span style={{ fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>{locateError}</span>
            </div>
          )}

          {/* Clear map — visible only when a route or search pin is on the map */}
          {mapHasOverlays && (
            <button
              onClick={handleClearMap}
              className="absolute right-4 z-[1000] flex items-center gap-2 pl-3 pr-4 h-11 rounded-full shadow-lg bg-white active:scale-95 transition-all"
              style={{ bottom: 'calc(var(--bs-visible, 232px) + 14px)' }}
              aria-label={t('clear_map')}
            >
              <RotateCcw size={16} className="flex-shrink-0 text-gray-600" />
              <span
                className="text-sm font-semibold whitespace-nowrap text-gray-700"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {t('clear_map')}
              </span>
            </button>
          )}

          {/* Bus info card — shown when a bus is selected via map tap */}
          {selectedVehicle && selectedRoute && (
            <BusInfoCard
              vehicle={selectedVehicle}
              route={selectedRoute}
              showShortId={twinExists}
              onDismiss={() => { setSelectedVehicleId(null); setActiveRouteId(null) }}
              onShowRoute={handleShowRouteFromCard}
            />
          )}

          <BottomSheet
            items={nearbyItems}
            selectedVehicleId={selectedVehicleId}
            referencePosition={referencePosition}
            isSearchMode={searchLocation !== null}
            onSelect={handleSelectBus}
            isLoading={isLoading}
          />

          <InstallButton />
        </>
      )}

      {/* ── Shared overlays ── */}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        isDriverMode={isDriverMode}
        isRouteActive={isRouteActive}
        authenticatedBusNumber={driverAuth?.busNumber ?? null}
        routes={routes}
        vehicles={vehicles}
        onEnterDriverMode={handleEnterDriverMode}
        onStartRoute={handleStartRoute}
        onStopRoute={handleStopRoute}
        onRouteSelect={handleRouteSelect}
      />

      {showPINModal && (
        <DriverPINModal
          onSuccess={handlePINSuccess}
          onClose={() => setShowPINModal(false)}
          onVerify={authenticateDriver}
        />
      )}

      <OnboardingModal />
      <UpdateBanner />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppInner />
    </LanguageProvider>
  )
}
