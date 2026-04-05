import { createClient } from '@supabase/supabase-js'
import type { VehicleLocation, DriverAuth } from '../types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const msg = 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Please check your Vercel Dashboard Environment Variables.'
  console.error('[Supabase]', msg)
  // In production, throw to catch via ErrorBoundary
  if (import.meta.env.PROD) {
    throw new Error(msg)
  }
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Maps a real `vehicles` table row to our VehicleLocation type.
 * Actual columns: id, bus_number, latitude, longitude, last_updated, is_active, driver_pin
 */
function rowToVehicle(row: Record<string, unknown>): VehicleLocation {
  const busNumber = String(row.bus_number ?? '')
  return {
    id: String(row.id ?? ''),
    busNumber,
    routeId: busNumber,               // use busNumber as the route key
    routeName: busNumber,
    position: {
      lat: Number(row.latitude ?? 0),
      lng: Number(row.longitude ?? 0),
    },
    heading: 0,
    speed: 0,
    isActive: Boolean(row.is_active ?? false),
    updatedAt: String(row.last_updated ?? new Date().toISOString()),
  }
}

// ── Read ─────────────────────────────────────────────────────────────────────

/**
 * Fetches all active buses from the `vehicles` table.
 */
export async function fetchVehicles(): Promise<VehicleLocation[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, bus_number, latitude, longitude, last_updated, is_active')
    .eq('is_active', true)
    .order('last_updated', { ascending: false })

  if (error) {
    console.error('[Supabase] fetchVehicles error:', error.message)
    return []
  }

  return (data ?? []).map((row) => rowToVehicle(row as Record<string, unknown>))
}

// ── Driver auth ───────────────────────────────────────────────────────────────

/**
 * Discriminated union returned by authenticateDriver():
 *   ok            → PIN correct, bus available → proceed to driver mode
 *   wrong_pin     → PIN not found in database
 *   already_active → PIN correct but this bus is currently live on another device.
 *                    (is_active=true AND last_updated within the past 5 minutes)
 *                    Stale sessions older than 5 min are treated as recoverable.
 */
export type AuthResult =
  | { status: 'ok'; data: DriverAuth }
  | { status: 'wrong_pin' }
  | { status: 'already_active' }

/** How old a session must be (ms) before we consider it stale and allow re-auth. */
const STALE_SESSION_MS = 5 * 60 * 1000 // 5 minutes

export async function authenticateDriver(pin: string): Promise<AuthResult> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, bus_number, is_active, last_updated')
    .eq('driver_pin', pin)
    .limit(1)
    .single()

  if (error || !data) {
    return { status: 'wrong_pin' }
  }

  // Reject if another device is actively broadcasting this bus right now.
  // Allow re-auth if the session is stale (app crash, phone died, etc.).
  if (data.is_active) {
    const lastUpdated = data.last_updated ? new Date(data.last_updated as string).getTime() : 0
    const sessionAge = Date.now() - lastUpdated
    if (sessionAge < STALE_SESSION_MS) {
      return { status: 'already_active' }
    }
    // Stale session — silently clear it so the new login works cleanly
    await supabase
      .from('vehicles')
      .update({ is_active: false })
      .eq('id', data.id)
  }

  return {
    status: 'ok',
    data: {
      vehicleId: String(data.id),
      busNumber: String(data.bus_number ?? ''),
    },
  }
}

// ── Driver location updates ───────────────────────────────────────────────────

/**
 * Updates the bus position in the `vehicles` table.
 * Only writes the columns that actually exist in the schema.
 * Called every 30 seconds by the driver's GPS watcher.
 */
export async function updateDriverLocation(
  vehicleId: string,
  lat: number,
  lng: number
): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update({
      latitude: lat,
      longitude: lng,
      last_updated: new Date().toISOString(),
      is_active: true,
    })
    .eq('id', vehicleId)

  if (error) console.error('[Supabase] updateDriverLocation error:', error.message)
}

/**
 * Sets is_active = true/false for a bus.
 * Call with true when driver starts a route, false when they stop.
 */
export async function setVehicleActive(vehicleId: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('vehicles')
    .update({ is_active: active, last_updated: new Date().toISOString() })
    .eq('id', vehicleId)

  if (error) console.error('[Supabase] setVehicleActive error:', error.message)
}

// ── Realtime ──────────────────────────────────────────────────────────────────

export type RealtimeVehicleEvent =
  | { type: 'upsert'; vehicle: VehicleLocation }
  | { type: 'delete'; id: string }

/**
 * Subscribes to realtime INSERT / UPDATE / DELETE on `vehicles`.
 * Returns an unsubscribe function.
 */
export function subscribeToVehicles(
  onEvent: (event: RealtimeVehicleEvent) => void
): () => void {
  const channel = supabase
    .channel('vehicles-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'vehicles' },
      (payload) => {
        const v = rowToVehicle(payload.new as Record<string, unknown>)
        if (v.isActive) onEvent({ type: 'upsert', vehicle: v })
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'vehicles' },
      (payload) => {
        const v = rowToVehicle(payload.new as Record<string, unknown>)
        if (v.isActive) {
          onEvent({ type: 'upsert', vehicle: v })
        } else {
          // Bus went inactive — remove it from the map
          onEvent({ type: 'delete', id: v.id })
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'vehicles' },
      (payload) => {
        const id = String((payload.old as Record<string, unknown>).id ?? '')
        if (id) onEvent({ type: 'delete', id })
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Supabase] Realtime subscribed on `vehicles`')
      }
    })

  return () => { supabase.removeChannel(channel) }
}

// Alias kept for backwards compatibility
export { subscribeToVehicles as subscribeToVehicleLocations }
