import type { LatLng } from '../types'

/**
 * Returns the closest point on a line segment [A, B] to point P.
 * All coordinates are treated as flat 2-D (suitable for small geographic areas).
 */
function closestPointOnSegment(p: LatLng, a: LatLng, b: LatLng): LatLng {
  const dx = b.lng - a.lng
  const dy = b.lat - a.lat
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return a
  let t = ((p.lng - a.lng) * dx + (p.lat - a.lat) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return { lat: a.lat + t * dy, lng: a.lng + t * dx }
}

/**
 * Snaps a raw GPS coordinate to the nearest point on a GeoJSON LineString route.
 * Returns the original coordinate if no route geometry is available.
 *
 * @param position   Raw GPS coordinate
 * @param geojson    A GeoJSON FeatureCollection containing LineString features
 */
export function snapToRoute(
  position: LatLng,
  geojson: GeoJSON.FeatureCollection | null
): LatLng {
  if (!geojson) return position

  let bestPoint: LatLng = position
  let bestDistSq = Infinity

  for (const feature of geojson.features) {
    if (feature.geometry.type !== 'LineString') continue
    const coords = feature.geometry.coordinates as [number, number][]

    for (let i = 0; i < coords.length - 1; i++) {
      const a: LatLng = { lat: coords[i][1], lng: coords[i][0] }
      const b: LatLng = { lat: coords[i + 1][1], lng: coords[i + 1][0] }
      const candidate = closestPointOnSegment(position, a, b)

      const dLat = candidate.lat - position.lat
      const dLng = candidate.lng - position.lng
      const distSq = dLat * dLat + dLng * dLng

      if (distSq < bestDistSq) {
        bestDistSq = distSq
        bestPoint = candidate
      }
    }
  }

  // Only snap if the nearest point is within ~50 m (≈ 0.00045 degrees)
  const snapThresholdSq = 0.00045 * 0.00045
  return bestDistSq < snapThresholdSq ? bestPoint : position
}
