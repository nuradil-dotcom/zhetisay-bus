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
 * Watches the device GPS and uploads the driver's position to Supabase
 * every 30 seconds. Pass the authenticated vehicleId so the correct row
 * is updated in the `vehicles` table.
 */
export function useGeolocation(vehicleId: string | null = null): UseGeolocationResult {
  const [position, setPosition] = useState<LatLng | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWatching, setIsWatching] = useState(false)

  const watchIdRef = useRef<number | null>(null)
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestPositionRef = useRef<LatLng | null>(null)

  const stopWatching = useCallback(async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (uploadTimerRef.current !== null) {
      clearInterval(uploadTimerRef.current)
      uploadTimerRef.current = null
    }
    // Mark bus as inactive in Supabase when driver stops
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

    setError(null)
    setIsWatching(true)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (geo) => {
        const pos: LatLng = { lat: geo.coords.latitude, lng: geo.coords.longitude }
        latestPositionRef.current = pos
        setPosition(pos)
      },
      (err) => {
        setError(err.message)
        stopWatching()
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    // Mark active immediately on start, then upload position every 30 s
    setVehicleActive(vehicleId, true)

    uploadTimerRef.current = setInterval(() => {
      const pos = latestPositionRef.current
      if (!pos || !vehicleId) return
      updateDriverLocation(vehicleId, pos.lat, pos.lng)
    }, 30_000)
  }, [vehicleId, stopWatching])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (uploadTimerRef.current !== null) clearInterval(uploadTimerRef.current)
    }
  }, [])

  return { position, error, isWatching, startWatching, stopWatching }
}
