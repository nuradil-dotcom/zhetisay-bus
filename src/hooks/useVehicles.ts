import { useState, useEffect } from 'react'
import { fetchVehicles, subscribeToVehicles } from '../lib/supabase'
import type { VehicleLocation } from '../types'

interface UseVehiclesResult {
  vehicles: VehicleLocation[]
  isLoading: boolean
  error: string | null
}

/**
 * Loads the initial vehicle snapshot from Supabase and keeps it
 * up-to-date via a Realtime subscription.
 *
 * INSERT  → adds the new bus to the list
 * UPDATE  → replaces the matching row in-place (triggers LERP in BusMarker)
 * DELETE  → removes the bus from the list
 */
export function useVehicles(): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<VehicleLocation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // Keep a stable ref to the realtime unsubscribe fn so we can call it on
    // cleanup even if the timeout fires after the component unmounts.
    let unsubscribe: (() => void) | null = null

    // ── Defer Supabase I/O by one event-loop tick ───────────────────────────
    // setTimeout(..., 0) yields to the browser's rendering pipeline so the
    // splash screen and map shell paint *before* any network requests start.
    // On a low-end CPU this can mean the difference between a visible splash
    // and an invisible one while JS blocks the main thread.
    const kickId = setTimeout(() => {
      if (cancelled) return

      // ── 1. Initial fetch ──────────────────────────────────────────────────
      fetchVehicles()
        .then((data) => {
          if (cancelled) return
          setVehicles(data)
          setIsLoading(false)
        })
        .catch((err: Error) => {
          if (cancelled) return
          setError(err.message)
          setIsLoading(false)
        })

      // ── 2. Live subscription ──────────────────────────────────────────────
      unsubscribe = subscribeToVehicles((event) => {
        if (cancelled) return

        if (event.type === 'upsert') {
          setVehicles((prev) => {
            const exists = prev.some((v) => v.id === event.vehicle.id)
            if (exists) {
              // UPDATE — replace in-place so BusMarker LERP animation triggers
              return prev.map((v) => (v.id === event.vehicle.id ? event.vehicle : v))
            }
            // INSERT — append new bus
            return [...prev, event.vehicle]
          })
        } else if (event.type === 'delete') {
          setVehicles((prev) => prev.filter((v) => v.id !== event.id))
        }
      })
    }, 0)

    return () => {
      cancelled = true
      clearTimeout(kickId)
      unsubscribe?.()
    }
  }, [])

  return { vehicles, isLoading, error }
}
