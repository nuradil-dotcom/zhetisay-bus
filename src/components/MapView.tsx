import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import type { LatLngBoundsExpression } from 'leaflet'
import L from 'leaflet'
import RoutePolyline from './RoutePolyline'
import RouteArrows from './RouteArrows'
import BusMarker from './BusMarker'
import UserLocationMarker from './UserLocationMarker'
import { ZHETISAY_CENTER, ZHETISAY_BOUNDS } from '../lib/mockData'
import type { BusRoute, VehicleLocation, LatLng } from '../types'

interface MapViewProps {
  routes: BusRoute[]
  vehicles: VehicleLocation[]
  /** ID of the route whose polyline should be visible */
  activeRouteId: string | null
  selectedVehicleId: string | null
  userPosition: LatLng | null
  userAccuracy?: number
  /** Fly to a single point (search result / locate-me) */
  flyToTarget: LatLng | null
  /** Fit map to a route's full extent */
  fitBoundsTarget: LatLngBoundsExpression | null
  /** Pin shown at the searched / selected location */
  searchLocation: LatLng | null
  /** Called when a bus marker is tapped */
  onBusClick: (vehicleId: string) => void
}

// ── Search pin icon ───────────────────────────────────────────────────────────
const searchPinIcon = L.divIcon({
  className: '',
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 32 44" fill="none" style="filter:drop-shadow(0 4px 10px rgba(0,0,0,0.4))">
    <path d="M16 0C7.163 0 0 7.163 0 16c0 10.5 14 28 16 28s16-17.5 16-28C32 7.163 24.837 0 16 0z" fill="#FFD700"/>
    <path d="M16 1C7.715 1 1 7.715 1 16c0 10.1 13.5 27.2 15 27.2S31 26.1 31 16C31 7.715 24.285 1 16 1z" stroke="white" stroke-width="2"/>
    <circle cx="16" cy="15" r="5.5" fill="#1A1A1B"/>
  </svg>`,
  iconSize: [32, 44],
  iconAnchor: [16, 44],
})

// ── MapController: flyTo a point OR fitBounds to a route ─────────────────────
function MapController({
  target,
  fitBoundsTarget,
}: {
  target: LatLng | null
  fitBoundsTarget: LatLngBoundsExpression | null
}) {
  const map = useMap()
  // Tracks the last key we flew to so that tapping the same bus twice in a row
  // doesn't restart the fly animation unnecessarily. Reset to '' whenever
  // target is cleared so a re-tap after deselect always re-flies.
  const prevFlyKey = useRef<string>('')

  useEffect(() => {
    if (!target) {
      prevFlyKey.current = ''
      return
    }
    const key = `${target.lat},${target.lng}`
    if (key === prevFlyKey.current) return
    prevFlyKey.current = key
    map.stop()
    map.flyTo([target.lat, target.lng], 16, { duration: 1.2 })
  }, [map, target])

  // No deduplication here — every explicit "Show Route" / "Select route from menu"
  // must always animate, even for the same route selected multiple times.
  // map.stop() cancels any in-progress flyTo before fitBounds starts.
  useEffect(() => {
    if (!fitBoundsTarget) return
    map.stop()
    map.fitBounds(fitBoundsTarget as L.LatLngBoundsExpression, {
      padding: [48, 48],
      maxZoom: 15,
      animate: true,
      duration: 1.0,
    })
  }, [map, fitBoundsTarget])

  return null
}

// ── Main component ────────────────────────────────────────────────────────────
const bounds: LatLngBoundsExpression = ZHETISAY_BOUNDS

export default function MapView({
  routes,
  vehicles,
  activeRouteId,
  selectedVehicleId,
  userPosition,
  userAccuracy = 40,
  flyToTarget,
  fitBoundsTarget,
  searchLocation,
  onBusClick,
}: MapViewProps) {
  // Only the active route is rendered — all others are invisible by default
  const activeRoute = activeRouteId ? routes.find((r) => r.id === activeRouteId) : null

  return (
    <MapContainer
      center={ZHETISAY_CENTER}
      zoom={14}
      minZoom={12}
      maxZoom={22}
      maxBounds={bounds}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      attributionControl={false}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={22}
        maxNativeZoom={19}
      />

      <MapController target={flyToTarget} fitBoundsTarget={fitBoundsTarget} />

      {/* Only the currently selected route polyline is drawn */}
      {activeRoute && (
        <>
          <RoutePolyline key={activeRoute.id} route={activeRoute} isActive />
          <RouteArrows key={`arrows-${activeRoute.id}`} route={activeRoute} />
        </>
      )}

      {vehicles.map((v) => (
        <BusMarker
          key={v.id}
          vehicle={v}
          busNumber={v.busNumber}
          isSelected={v.id === selectedVehicleId}
          interpolationMs={30_000}
          onClick={onBusClick}
        />
      ))}

      {userPosition && (
        <UserLocationMarker
          position={userPosition}
          accuracy={userAccuracy}
        />
      )}

      {searchLocation && (
        <Marker
          position={[searchLocation.lat, searchLocation.lng]}
          icon={searchPinIcon}
        />
      )}
    </MapContainer>
  )
}
