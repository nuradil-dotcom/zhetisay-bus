import type { LatLng } from '../types'
import { haversineMeters } from './lerp'

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

/** Snap `position` to the nearest point on a flat coordinate array ([lng, lat][]). */
function snapToCoordArray(
  position: LatLng,
  coords: [number, number][]
): { point: LatLng; distSq: number } {
  let bestPoint: LatLng = position
  let bestDistSq = Infinity

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

  return { point: bestPoint, distSq: bestDistSq }
}

/**
 * Snaps a raw GPS coordinate to the nearest point on a specific leg (coordinate array).
 * Returns the original coordinate if the nearest point is more than ~50 m away.
 *
 * @param position   Raw GPS coordinate
 * @param legCoords  GeoJSON coordinate array ([lng, lat][]) for the target leg
 */
export function snapToLegCoords(
  position: LatLng,
  legCoords: [number, number][]
): LatLng {
  const { point, distSq } = snapToCoordArray(position, legCoords)
  const snapThresholdSq = 0.00045 * 0.00045
  return distSq < snapThresholdSq ? point : position
}

/**
 * Returns true if `a` is within 50 metres of `b`.
 */
export function isWithin50m(a: LatLng, b: LatLng): boolean {
  return haversineMeters(a, b) <= 50
}

/**
 * Snaps a raw GPS coordinate to the nearest point on a GeoJSON LineString or
 * MultiLineString route.  Returns the original coordinate if no route geometry
 * is available or if GPS is more than ~50 m from the route.
 *
 * @param position   Raw GPS coordinate
 * @param geojson    A GeoJSON FeatureCollection containing LineString / MultiLineString features
 */
export function snapToRoute(
  position: LatLng,
  geojson: GeoJSON.FeatureCollection | null
): LatLng {
  if (!geojson) return position

  let bestPoint: LatLng = position
  let bestDistSq = Infinity

  for (const feature of geojson.features) {
    if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates as [number, number][]
      const { point, distSq } = snapToCoordArray(position, coords)
      if (distSq < bestDistSq) {
        bestDistSq = distSq
        bestPoint = point
      }
    } else if (feature.geometry.type === 'MultiLineString') {
      const legs = feature.geometry.coordinates as [number, number][][]
      for (const coords of legs) {
        const { point, distSq } = snapToCoordArray(position, coords)
        if (distSq < bestDistSq) {
          bestDistSq = distSq
          bestPoint = point
        }
      }
    }
  }

  // Only snap if the nearest point is within ~50 m (≈ 0.00045 degrees)
  const snapThresholdSq = 0.00045 * 0.00045
  return bestDistSq < snapThresholdSq ? bestPoint : position
}
