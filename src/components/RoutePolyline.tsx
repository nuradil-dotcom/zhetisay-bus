import { GeoJSON } from 'react-leaflet'
import type { BusRoute } from '../types'

interface RoutePolylineProps {
  route: BusRoute
  isActive?: boolean
}

/**
 * Renders a GeoJSON bus route as a styled polyline on the map.
 */
export default function RoutePolyline({ route, isActive = false }: RoutePolylineProps) {
  if (!route.geojson) return null

  return (
    <GeoJSON
      key={`${route.id}-${isActive}`}
      data={route.geojson}
      style={() => ({
        color: isActive ? '#2563EB' : route.color,
        weight: isActive ? 5 : 3,
        opacity: isActive ? 1 : 0.6,
        lineCap: 'round',
        lineJoin: 'round',
      })}
    />
  )
}
