import { useState, useEffect, useRef, useCallback } from 'react'
import type { LatLng } from '../types'
import { updateDriverLocation, setVehicleActive } from '../lib/supabase'
import { snapToRoute } from '../lib/routeSnapping'

interface UseGeolocationResult {
  position: LatLng | null
  accuracy: number | null
  lastUploadAt: Date | null
  error: string | null
  isWatching: boolean
  startWatching: () => void
  stopWatching: () => void
}

/**
 * Watches the device GPS and uploads the driver's position to Supabase.
 *
 * Safari compatibility note:
 *   navigator.geolocation.watchPosition() MUST be called synchronously within
 *   the user-gesture call stack (the tap event). Any await before it breaks
 *   Safari's user-gesture requirement and the call silently fails even when
 *   permission has already been granted. Therefore startWatching() is a plain
 *   synchronous function — no async wrappers, no permission pre-checks.
 *
 * Route snapping:
 *   Raw GPS coordinates are snapped to the nearest point on the driver's route
 *   before being uploaded to Supabase. This keeps the bus marker on the road
 *   rather than on buildings adjacent to the street.
 *   Pass routeGeojson to enable snapping; null disables it (raw GPS uploaded).
 *
 * Error handling:
 *   Code 1 (PERMISSION_DENIED)  → permanent, stops the session
 *   Code 2 (POSITION_UNAVAILABLE) → transient, keeps watching (GPS recovers)
 *   Code 3 (TIMEOUT)              → transient, keeps watching
 *
 * Upload strategy:
 *   First GPS fix → uploaded immediately (bus appears on map right away)
 *   Subsequent fixes → uploaded every 30 s to conserve Supabase quota
 */
export function useGeolocation(
  vehicleId: string | null = null,
  routeGeojson: GeoJSON.FeatureCollection | null = null
): UseGeolocationResult {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [lastUploadAt, setLastUploadAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWatching, setIsWatching] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestPositionRef = useRef<LatLng | null>(null)
  const firstFixUploadedRef = useRef(false)
  // Keep stable refs so callbacks never capture stale closures
  const vehicleIdRef = useRef(vehicleId)
  const routeGeojsonRef = useRef(routeGeojson)
  useEffect(() => { vehicleIdRef.current = vehicleId }, [vehicleId])
  useEffect(() => { routeGeojsonRef.current = routeGeojson }, [routeGeojson])

  const stopWatching = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (uploadTimerRef.current !== null) {
      clearInterval(uploadTimerRef.current)
      uploadTimerRef.current = null
    }
    firstFixUploadedRef.current = false
    latestPositionRef.current = null
    const vid = vehicleIdRef.current
    if (vid) {
      await setVehicleActive(vid, false)
    }
    setIsWatching(false)
  }, [])

  // ── startWatching MUST remain synchronous ─────────────────────────────────
  // Safari checks that watchPosition is called in the same synchronous call
  // stack as the user tap. Any await before it silently breaks geolocation
  // even when permission has already been granted.
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }
    const vid = vehicleIdRef.current
    if (!vid) {
      setError('No vehicle authenticated.')
      return
    }

    setError(null)
    setIsWatching(true)
    firstFixUploadedRef.current = false

    // ── watchPosition called synchronously — critical for Safari ─────────
    watchIdRef.current = navigator.geolocation.watchPosition(
      (geo) => {
        // Discard fixes too imprecise to snap reliably. A reported accuracy
        // worse than 50 m means the raw coordinate could be a full street-width
        // away from the real position — snapping would produce misleading results.
        // The next fix (usually within seconds) will be better.
        if (geo.coords.accuracy > 50) return

        const rawPos: LatLng = { lat: geo.coords.latitude, lng: geo.coords.longitude }

        // Snap to the nearest point on the driver's route before storing/uploading.
        // This keeps the bus icon on the road rather than on adjacent buildings.
        // snapToRoute returns rawPos unchanged when geojson is null or GPS is far from route.
        const snappedPos = snapToRoute(rawPos, routeGeojsonRef.current)

        latestPositionRef.current = snappedPos
        setPosition(snappedPos)
        setAccuracy(Math.round(geo.coords.accuracy))
        setError(null) // clear any prior transient error once GPS recovers

        // Upload the first fix immediately so the bus appears on the passenger
        // map right away rather than waiting up to 30 seconds
        if (!firstFixUploadedRef.current) {
          firstFixUploadedRef.current = true
          const currentVid = vehicleIdRef.current
          if (currentVid) {
            void updateDriverLocation(currentVid, snappedPos.lat, snappedPos.lng)
              .then(() => setLastUploadAt(new Date()))
          }
        }
      },
      (err) => {
        setError(err.message)
        // Code 1 = PERMISSION_DENIED — permanent, cannot recover
        // Codes 2/3 = transient (indoors / slow lock) — keep watching
        if (err.code === 1) {
          void stopWatching()
        }
      },
      // enableHighAccuracy: true is essential for real GPS (not cell-tower).
      // timeout of 20 s gives Safari enough time to acquire the first fix.
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    )

    // Mark the bus as active in Supabase immediately
    void setVehicleActive(vid, true)

    // Upload position on a 30-second cadence after the first immediate upload
    uploadTimerRef.current = setInterval(() => {
      const pos = latestPositionRef.current
      const currentVid = vehicleIdRef.current
      if (!pos || !currentVid) return
      void updateDriverLocation(currentVid, pos.lat, pos.lng)
        .then(() => setLastUploadAt(new Date()))
    }, 30_000)
  }, [stopWatching])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (uploadTimerRef.current !== null) clearInterval(uploadTimerRef.current)
    }
  }, [])

  return { position, accuracy, lastUploadAt, error, isWatching, startWatching, stopWatching }
}
