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

    // ── 1. Initial fetch ────────────────────────────────────────────────────
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

    // ── 2. Live subscription ────────────────────────────────────────────────
    const unsubscribe = subscribeToVehicles((event) => {
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

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return { vehicles, isLoading, error }
}
