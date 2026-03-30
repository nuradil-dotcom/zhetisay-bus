import { useEffect, useRef, useState } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import { lerpLatLng, haversineMeters } from '../lib/lerp'
import type { LatLng, VehicleLocation } from '../types'

// Inline SVG for Lucide's "Bus" icon (stroke-based, #1A1A1B on #FFD700 background)
const BUS_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
       fill="none" stroke="#1A1A1B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 6v6"/>
    <path d="M15 6v6"/>
    <path d="M2 12h19.6"/>
    <path d="M18 18h2a2 2 0 0 0 2-2V9a5 5 0 0 0-5-5H5a5 5 0 0 0-5 5v7a2 2 0 0 0 2 2h2"/>
    <circle cx="8" cy="18" r="2"/>
    <path d="M9 18h6"/>
    <circle cx="16" cy="18" r="2"/>
  </svg>`

function createBusIcon(
  heading: number,
  busNumber: string,
  isSelected: boolean
): L.DivIcon {
  const ring = isSelected
    ? `<div style="
        position:absolute; inset:-6px;
        border-radius:50%;
        border:3px solid #FFD700;
        opacity:0.85;
        box-shadow:0 0 0 4px rgba(255,215,0,0.25);
        pointer-events:none;
      "></div>`
    : ''

  return L.divIcon({
    className: '',
    html: `
      <div style="
        position:relative;
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:3px;
      ">
        <div style="
          position:relative;
          width:40px;height:40px;
          background:#FFD700;
          border-radius:50%;
          border:${isSelected ? '3px solid #fff' : '2.5px solid #1A1A1B'};
          display:flex;align-items:center;justify-content:center;
          box-shadow:${isSelected
            ? '0 4px 16px rgba(0,0,0,0.6), 0 0 0 6px rgba(255,215,0,0.3)'
            : '0 3px 10px rgba(0,0,0,0.5)'};
          transform:rotate(${heading}deg);
        ">
          ${ring}
          ${BUS_SVG}
        </div>
        <div style="
          background:#1A1A1B;
          color:#FFD700;
          font-size:11px;
          font-weight:800;
          font-family:Inter,sans-serif;
          padding:1px 7px;
          border-radius:8px;
          line-height:1.5;
          letter-spacing:0.02em;
          box-shadow:0 2px 6px rgba(0,0,0,0.5);
          border:1.5px solid rgba(255,215,0,0.4);
          white-space:nowrap;
        ">${busNumber}</div>
      </div>`,
    iconSize: [40, 60],
    iconAnchor: [20, 20],
  })
}

interface BusMarkerProps {
  vehicle: VehicleLocation
  busNumber: string
  isSelected?: boolean
  interpolationMs?: number
  onClick?: (vehicleId: string) => void
}

/** Maximum distance in metres before snapping instead of interpolating. */
const SNAP_THRESHOLD_METERS = 300

/**
 * Smooth LERP-animated bus marker. Displays bus route number below the icon.
 * Shows a selection ring when isSelected = true.
 * If the new position is >300 m away from the current display position, the
 * marker snaps instantly to avoid slow post-offline crawling.
 */
export default function BusMarker({
  vehicle,
  busNumber,
  isSelected = false,
  interpolationMs = 30_000,
  onClick,
}: BusMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)
  const prevPosRef = useRef<LatLng>(vehicle.position)
  const targetPosRef = useRef<LatLng>(vehicle.position)
  const startTimeRef = useRef<number>(performance.now())
  const rafRef = useRef<number | null>(null)

  const [displayPos, setDisplayPos] = useState<LatLng>(vehicle.position)

  // Animate position via LERP, with a snap threshold for large jumps
  useEffect(() => {
    const distance = haversineMeters(displayPos, vehicle.position)

    if (distance > SNAP_THRESHOLD_METERS) {
      // Vehicle has jumped more than 300 m (e.g. came back online after a gap).
      // Cancel any running animation and snap immediately to avoid slow crawling.
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      prevPosRef.current = vehicle.position
      targetPosRef.current = vehicle.position
      setDisplayPos(vehicle.position)
      return
    }

    prevPosRef.current = displayPos
    targetPosRef.current = vehicle.position
    startTimeRef.current = performance.now()

    const animate = (now: number) => {
      const t = Math.min((now - startTimeRef.current) / interpolationMs, 1)
      const interpolated = lerpLatLng(prevPosRef.current, targetPosRef.current, t)
      setDisplayPos(interpolated)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        prevPosRef.current = targetPosRef.current
      }
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle.position.lat, vehicle.position.lng])

  // Update icon when heading, selection, or busNumber changes
  useEffect(() => {
    markerRef.current?.setIcon(createBusIcon(vehicle.heading, busNumber, isSelected))
  }, [vehicle.heading, busNumber, isSelected])

  return (
    <Marker
      ref={markerRef}
      position={[displayPos.lat, displayPos.lng]}
      icon={createBusIcon(vehicle.heading, busNumber, isSelected)}
      eventHandlers={{
        click: () => onClick?.(vehicle.id),
      }}
    />
  )
}
