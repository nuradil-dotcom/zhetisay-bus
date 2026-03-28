import { haversineMeters } from './lerp'
import type { LatLng, VehicleLocation } from '../types'

export type GpsPingUiStatus = 'active' | 'resting' | 'lost'

const STALE_AFTER_SECONDS = 60
const BAZAAR_REST_RADIUS_M = 100

export function getGpsPingUiStatus(
  vehicle: VehicleLocation,
  bazaar: LatLng,
  nowMs: number
): { ageInSeconds: number; status: GpsPingUiStatus } {
  const updatedMs = new Date(vehicle.updatedAt).getTime()
  if (Number.isNaN(updatedMs)) {
    return { ageInSeconds: Infinity, status: 'lost' }
  }
  const ageInSeconds = (nowMs - updatedMs) / 1000
  if (ageInSeconds <= STALE_AFTER_SECONDS) {
    return { ageInSeconds, status: 'active' }
  }
  const distM = haversineMeters(vehicle.position, bazaar)
  if (distM <= BAZAAR_REST_RADIUS_M) {
    return { ageInSeconds, status: 'resting' }
  }
  return { ageInSeconds, status: 'lost' }
}
