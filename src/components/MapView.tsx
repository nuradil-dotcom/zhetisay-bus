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
  html: `
    <div style="
      width: 36px; height: 48px;
      display: flex; flex-direction: column;
      align-items: center;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.35));
    ">
      <!-- Pin head: pill with inner ring -->
      <div style="
        width: 32px; height: 32px;
        background: rgba(26,26,27,0.92);
        backdrop-filter: blur(8px);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        border: 1.5px solid rgba(255,215,0,0.6);
        box-shadow: 0 0 0 3px rgba(255,215,0,0.12), inset 0 1px 0 rgba(255,255,255,0.08);
      ">
        <div style="
          width: 8px; height: 8px;
          background: #FFD700;
          border-radius: 50%;
          box-shadow: 0 0 6px rgba(255,215,0,0.8);
        "></div>
      </div>
      <!-- Slim needle -->
      <div style="
        width: 1.5px; height: 12px;
        background: linear-gradient(to bottom, rgba(255,215,0,0.7), rgba(255,215,0,0));
        margin-top: 1px;
        border-radius: 1px;
      "></div>
    </div>`,
  iconSize: [36, 48],
  iconAnchor: [18, 48],
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
