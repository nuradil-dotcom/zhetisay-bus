import { GeoJSON } from 'react-leaflet'
import type { BusRoute } from '../types'

interface RoutePolylineProps {
  route: BusRoute
  isActive?: boolean
}

/**
 * Renders a bus route as a glowing polyline.
 *
 * When active, two GeoJSON layers are stacked:
 *   1. Halo  — wide, semi-transparent, same colour → creates the glow bloom
 *   2. Core  — narrow, fully opaque solid line on top
 *
 * The visual result is a neon/glowing route line that stands out clearly on
 * the map tile background.
 */
export default function RoutePolyline({ route, isActive = false }: RoutePolylineProps) {
  if (!route.geojson) return null

  if (!isActive) {
    return (
      <GeoJSON
        key={`${route.id}-inactive`}
        data={route.geojson}
        style={() => ({
          color: route.color,
          weight: 3,
          opacity: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
        })}
      />
    )
  }

  return (
    <>
      {/* Halo layer — wide, blurred glow */}
      <GeoJSON
        key={`${route.id}-glow`}
        data={route.geojson}
        style={() => ({
          color: route.color,
          weight: 18,
          opacity: 0.22,
          lineCap: 'round',
          lineJoin: 'round',
        })}
      />
      {/* Mid glow — medium width */}
      <GeoJSON
        key={`${route.id}-mid`}
        data={route.geojson}
        style={() => ({
          color: route.color,
          weight: 10,
          opacity: 0.38,
          lineCap: 'round',
          lineJoin: 'round',
        })}
      />
      {/* Core line — solid, crisp */}
      <GeoJSON
        key={`${route.id}-core`}
        data={route.geojson}
        style={() => ({
          color: route.color,
          weight: 4.5,
          opacity: 1,
          lineCap: 'round',
          lineJoin: 'round',
        })}
      />
    </>
  )
}
