import { useState, useEffect, useRef, useCallback } from 'react'
import type { LatLng } from '../types'
import { updateDriverLocation, setVehicleActive } from '../lib/supabase'
import { snapToRoute, snapToLegCoords, isWithin50m } from '../lib/routeSnapping'

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
 *   Subsequent fixes → uploaded every 5 s for high-fidelity real-time tracking
 */
export function useGeolocation(
  vehicleId: string | null = null,
  routeGeojson: GeoJSON.FeatureCollection | null = null,
  pivotPoint: LatLng | null = null,
  zigzagPoint: LatLng | null = null
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
  // 0 = Leg 0 (Northbound), 1 = Leg 1 (Southbound). Latches to 1 once pivot is reached.
  const activeLegRef = useRef(0)
  // Keep stable refs so callbacks never capture stale closures
  const vehicleIdRef = useRef(vehicleId)
  const routeGeojsonRef = useRef(routeGeojson)
  const pivotPointRef = useRef(pivotPoint)
  const zigzagPointRef = useRef(zigzagPoint)
  useEffect(() => { vehicleIdRef.current = vehicleId }, [vehicleId])
  useEffect(() => { routeGeojsonRef.current = routeGeojson }, [routeGeojson])
  useEffect(() => { pivotPointRef.current = pivotPoint }, [pivotPoint])
  useEffect(() => { zigzagPointRef.current = zigzagPoint }, [zigzagPoint])

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
    activeLegRef.current = 0

    // ── watchPosition called synchronously — critical for Safari ─────────
    watchIdRef.current = navigator.geolocation.watchPosition(
      (geo) => {
        // Discard fixes too imprecise to snap reliably. A reported accuracy
        // worse than 50 m means the raw coordinate could be a full street-width
        // away from the real position — snapping would produce misleading results.
        // The next fix (usually within seconds) will be better.
        if (geo.coords.accuracy > 50) return

        const rawPos: LatLng = { lat: geo.coords.latitude, lng: geo.coords.longitude }

        // Pivot detection for multi-leg routes (e.g. Route 2).
        // Polyclinic (Leg 0 → Leg 1): driver reaches the northern terminus.
        // ZigZag     (Leg 1 → Leg 0): driver returns to the southern terminus,
        //   resetting for the next northbound lap.
        const pivot = pivotPointRef.current
        const zigzag = zigzagPointRef.current
        if (pivot && activeLegRef.current === 0 && isWithin50m(rawPos, pivot)) {
          activeLegRef.current = 1
        } else if (zigzag && activeLegRef.current === 1 && isWithin50m(rawPos, zigzag)) {
          activeLegRef.current = 0
        }

        // Snap to the nearest point on the driver's route.
        // For MultiLineString routes, snap only to the currently active leg so
        // the position doesn't accidentally jump to the opposite direction leg.
        let snappedPos: LatLng
        const geojson = routeGeojsonRef.current
        const multiFeature = geojson?.features.find(
          (f) => f.geometry.type === 'MultiLineString'
        )
        if (pivot && multiFeature && multiFeature.geometry.type === 'MultiLineString') {
          const legs = multiFeature.geometry.coordinates as [number, number][][]
          const legCoords = legs[activeLegRef.current] ?? legs[0]
          snappedPos = snapToLegCoords(rawPos, legCoords)
        } else {
          snappedPos = snapToRoute(rawPos, geojson)
        }

        // Jitter guard: discard tiny moves caused by GPS wobble while parked
        // or on a weak signal. At < 8 m the bus marker would visibly jitter
        // across road edges without the driver actually moving.
        if (latestPositionRef.current &&
            haversineMeters(latestPositionRef.current, snappedPos) < 8) return

        latestPositionRef.current = snappedPos
        setPosition(snappedPos)
        setAccuracy(Math.round(geo.coords.accuracy))
        setError(null) // clear any prior transient error once GPS recovers

        // Upload the first fix immediately so the bus appears on the passenger
        // map right away rather than waiting up to 5 seconds
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
      // maximumAge: 0 — never use a cached position; each callback reflects a fresh fix.
      // enableHighAccuracy: true — prefer GPS hardware over Wi‑Fi / cell approximation.
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    )

    // Mark the bus as active in Supabase immediately
    void setVehicleActive(vid, true)

    // Upload position every 3 s for high-fidelity real-time tracking.
    // 3 s balances Supabase write cost against positional accuracy;
    // at 5 s the LERP overshoots noticeably on direction changes.
    uploadTimerRef.current = setInterval(() => {
      const pos = latestPositionRef.current
      const currentVid = vehicleIdRef.current
      if (!pos || !currentVid) return
      void updateDriverLocation(currentVid, pos.lat, pos.lng)
        .then(() => setLastUploadAt(new Date()))
    }, 3_000)
  }, [stopWatching])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (uploadTimerRef.current !== null) clearInterval(uploadTimerRef.current)
    }
  }, [])

  return { position, accuracy, lastUploadAt, error, isWatching, startWatching, stopWatching }
}
