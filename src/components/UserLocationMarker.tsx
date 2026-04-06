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
function createLocationIcon(): L.DivIcon {
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

interface UserLocationMarkerProps {
  position: LatLng
  accuracy?: number
}

/**
 * Renders the user's location as a plain pulsing gold circle marker.
 * The accuracy circle is always shown.
 */
export default function UserLocationMarker({
  position,
  accuracy = 40,
}: UserLocationMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)

  // We don't need to update the icon on heading changes anymore since it's just a circle
  useEffect(() => {
    markerRef.current?.setIcon(createLocationIcon())
  }, [])

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
        icon={createLocationIcon()}
      />
    </>
  )
}
