import { Marker, Circle } from 'react-leaflet'
import L from 'leaflet'
import type { LatLng } from '../types'

const locationIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="
        position:absolute;inset:0;border-radius:50%;
        background:rgba(255,215,0,0.3);
        animation:pulse-ring 1.8s ease-out infinite;
      "></div>
      <div style="
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:16px;height:16px;
        background:#FFD700;border-radius:50%;
        border:2.5px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
      "></div>
    </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

interface UserLocationMarkerProps {
  position: LatLng
  accuracy?: number
}

/** Just renders the dot + accuracy circle. Map navigation is handled by MapController. */
export default function UserLocationMarker({ position, accuracy = 40 }: UserLocationMarkerProps) {
  return (
    <>
      <Circle
        center={[position.lat, position.lng]}
        radius={accuracy}
        pathOptions={{ color: '#FFD700', fillColor: '#FFD700', fillOpacity: 0.12, weight: 1 }}
      />
      <Marker position={[position.lat, position.lng]} icon={locationIcon} />
    </>
  )
}
