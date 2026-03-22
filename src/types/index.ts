export interface LatLng {
  lat: number
  lng: number
}

export interface BusRoute {
  id: string
  name: string
  number: string
  color: string
  geojson: GeoJSON.FeatureCollection | null
  fare: number
}

export interface BusStop {
  id: string
  routeId: string
  name: string
  position: LatLng
  order: number
}

export interface VehicleLocation {
  id: string
  busNumber: string   // from `bus_number` column
  routeId: string     // derived from busNumber for route polyline matching
  routeName: string   // derived from busNumber for display
  position: LatLng    // from `latitude` / `longitude` columns
  heading: number
  speed: number
  isActive: boolean   // from `is_active` column
  updatedAt: string   // from `last_updated` column
}

/** Returned by authenticateDriver() */
export interface DriverAuth {
  vehicleId: string
  busNumber: string
}

export interface NearbyBus {
  vehicle: VehicleLocation
  route: BusRoute
  distanceMeters: number
  etaSeconds: number
}

export type AppMode = 'passenger' | 'driver'

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}
