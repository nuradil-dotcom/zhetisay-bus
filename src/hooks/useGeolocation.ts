import { useState, useEffect, useRef, useCallback } from 'react'
import type { LatLng } from '../types'
import { updateDriverLocation, setVehicleActive } from '../lib/supabase'

interface UseGeolocationResult {
  position: LatLng | null
  error: string | null
  isWatching: boolean
  startWatching: () => void
  stopWatching: () => void
}

/**
 * Watches the device GPS and uploads the driver's position to Supabase.
 * - First GPS fix is uploaded immediately (no 30-second delay on first appearance)
 * - Subsequent fixes are uploaded every 30 seconds to conserve quota
 * - Transient errors (POSITION_UNAVAILABLE, TIMEOUT) only show a warning;
 *   they do NOT stop the broadcast — GPS will recover automatically
 * - Only PERMISSION_DENIED (permanent) stops the broadcast and marks bus inactive
 * - Permission is pre-checked before starting to give a clear upfront error
 */
export function useGeolocation(vehicleId: string | null = null): UseGeolocationResult {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWatching, setIsWatching] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestPositionRef = useRef<LatLng | null>(null)
  const firstFixUploadedRef = useRef(false)

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
    if (vehicleId) {
      await setVehicleActive(vehicleId, false)
    }
    setIsWatching(false)
  }, [vehicleId])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }
    if (!vehicleId) {
      setError('No vehicle authenticated.')
      return
    }

    // Async permission check runs inside a void IIFE so the outer function stays sync
    void (async () => {
      // Pre-check permission state (Chrome / Android / modern Safari)
      if (navigator.permissions) {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' })
          if (status.state === 'denied') {
            setError('permission_denied')
            return
          }
        } catch {
          // Permissions API unsupported on this browser — proceed and let watchPosition decide
        }
      }

      setError(null)
      setIsWatching(true)
      firstFixUploadedRef.current = false

      watchIdRef.current = navigator.geolocation.watchPosition(
        (geo) => {
          const pos: LatLng = { lat: geo.coords.latitude, lng: geo.coords.longitude }
          latestPositionRef.current = pos
          setPosition(pos)
          setError(null) // clear any prior transient error once GPS recovers

          // Upload the very first fix immediately so the bus appears on passenger
          // maps right away rather than waiting up to 30 seconds
          if (!firstFixUploadedRef.current && vehicleId) {
            firstFixUploadedRef.current = true
            updateDriverLocation(vehicleId, pos.lat, pos.lng)
          }
        },
        (err) => {
          setError(err.message)

          // GeolocationPositionError codes:
          //   1 = PERMISSION_DENIED  — permanent, cannot recover → stop session
          //   2 = POSITION_UNAVAILABLE — transient (indoors, tunnel) → keep watching
          //   3 = TIMEOUT             — transient (slow lock)        → keep watching
          if (err.code === 1) {
            stopWatching()
          }
          // For codes 2 and 3: show the error indicator but DO NOT call stopWatching().
          // watchPosition keeps running and will deliver the next fix once GPS recovers.
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      )

      // Mark bus as active in Supabase immediately when driver hits Start
      setVehicleActive(vehicleId, true)

      // Upload position every 30 s after the first immediate fix
      uploadTimerRef.current = setInterval(() => {
        const pos = latestPositionRef.current
        if (!pos || !vehicleId) return
        updateDriverLocation(vehicleId, pos.lat, pos.lng)
      }, 30_000)
    })()
  }, [vehicleId, stopWatching])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (uploadTimerRef.current !== null) clearInterval(uploadTimerRef.current)
    }
  }, [])

  return { position, error, isWatching, startWatching, stopWatching }
}
