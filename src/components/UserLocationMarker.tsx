import { useEffect, useRef } from 'react'
import { Marker, Circle } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng } from '../types'

/**
 * Builds a Leaflet DivIcon for the user's location.
 *
 * heading = null  → pulsing gold circle (no compass data)
 * heading = 0-360 → Google-Maps-style teardrop arrow pointing in heading direction
 *
 * The teardrop is a rounded rectangle + triangle chevron pointing "up" (north=0°),
 * rotated by the heading value.  The pulsing ring is always rendered regardless.
 */
function createLocationIcon(heading: number | null): L.DivIcon {
  if (heading === null) {
    // Fallback: plain pulsing gold circle
    return L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:26px;height:26px;">
          <div style="
            position:absolute;inset:0;border-radius:50%;
            background:rgba(255,215,0,0.28);
            animation:pulse-ring 1.8s ease-out infinite;
          "></div>
          <div style="
            position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
            width:16px;height:16px;
            background:#FFD700;border-radius:50%;
            border:2.5px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.4);
          "></div>
        </div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    })
  }

  // Direction-aware teardrop icon (rotated to heading)
  // The SVG is drawn pointing "up" (north); CSS rotation applies the heading.
  return L.divIcon({
    className: '',
    html: `
      <div style="
        position:relative;
        width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
      ">
        <!-- Pulsing accuracy ring -->
        <div style="
          position:absolute;inset:-4px;border-radius:50%;
          background:rgba(255,215,0,0.22);
          animation:pulse-ring 2s ease-out infinite;
        "></div>

        <!-- Teardrop arrow, rotated to heading -->
        <div style="
          position:relative;
          width:28px;height:28px;
          transform:rotate(${heading}deg);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <!-- Outer white border shape -->
            <path
              d="M14 3
                 C9.5 3 6 6.5 6 11
                 C6 17 14 25 14 25
                 C14 25 22 17 22 11
                 C22 6.5 18.5 3 14 3Z"
              fill="white"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.35))"
            />
            <!-- Inner gold fill -->
            <path
              d="M14 4.5
                 C10.4 4.5 7.5 7.4 7.5 11
                 C7.5 16.2 14 23 14 23
                 C14 23 20.5 16.2 20.5 11
                 C20.5 7.4 17.6 4.5 14 4.5Z"
              fill="#FFD700"
            />
            <!-- Direction chevron (pointing up = north) -->
            <path
              d="M14 7 L10.5 13 L14 11 L17.5 13 Z"
              fill="#1A1A1B"
              opacity="0.85"
            />
          </svg>
        </div>
      </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

interface UserLocationMarkerProps {
  position: LatLng
  accuracy?: number
  heading?: number | null
}

/**
 * Renders the user's location as a direction-aware teardrop marker.
 * Shows a plain pulsing circle when no compass heading is available.
 * The accuracy circle is always shown.
 */
export default function UserLocationMarker({
  position,
  accuracy = 40,
  heading = null,
}: UserLocationMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)

  // Update icon when heading changes without re-mounting the marker
  useEffect(() => {
    markerRef.current?.setIcon(createLocationIcon(heading ?? null))
  }, [heading])

  return (
    <>
      <Circle
        center={[position.lat, position.lng]}
        radius={accuracy}
        pathOptions={{
          color: '#FFD700',
          fillColor: '#FFD700',
          fillOpacity: 0.10,
          weight: 1.5,
          opacity: 0.5,
        }}
      />
      <Marker
        ref={markerRef}
        position={[position.lat, position.lng]}
        icon={createLocationIcon(heading ?? null)}
      />
    </>
  )
}
