import { useMemo } from 'react'
import { Marker } from 'react-leaflet'
import L from 'leaflet'
import type { BusRoute } from '../types'
import { haversineMeters } from '../lib/lerp'

interface RouteArrowsProps {
  route: BusRoute
}

function computeBearing(p1: [number, number], p2: [number, number]) {
  // p1, p2 are [lng, lat]
  const lng1 = (p1[0] * Math.PI) / 180
  const lat1 = (p1[1] * Math.PI) / 180
  const lng2 = (p2[0] * Math.PI) / 180
  const lat2 = (p2[1] * Math.PI) / 180

  const y = Math.sin(lng2 - lng1) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(lng2 - lng1)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI
  return (bearing + 360) % 360
}

function getArrowPoints(line: [number, number][], spacingMeters: number) {
  const arrows: { position: [number, number]; bearing: number }[] = []
  let distanceSinceLastArrow = spacingMeters * 0.5 // Start the first arrow half-way in

  for (let i = 0; i < line.length - 1; i++) {
    const p1 = line[i]
    const p2 = line[i + 1]

    const d = haversineMeters(
      { lat: p1[1], lng: p1[0] },
      { lat: p2[1], lng: p2[0] }
    )

    if (distanceSinceLastArrow + d >= spacingMeters) {
      const bearing = computeBearing(p1, p2)
      arrows.push({
        position: [p2[1], p2[0]], // Leaflet uses [lat, lng]
        bearing,
      })
      distanceSinceLastArrow = 0
    } else {
      distanceSinceLastArrow += d
    }
  }
  return arrows
}

const createArrowIcon = (bearing: number, color: string) => {
  return L.divIcon({
    className: '',
    html: `<div style="transform: rotate(${bearing}deg); display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.5));">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
               <path d="M12 20V4M5 11l7-7 7 7"/>
             </svg>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

export default function RouteArrows({ route }: RouteArrowsProps) {
  const arrows = useMemo(() => {
    if (!route.geojson || !route.geojson.features) return []

    const spacing = 800 // Place an arrow every 800 meters

    let lines: [number, number][][] = []
    
    route.geojson.features.forEach((feature) => {
      if (feature.geometry.type === 'LineString') {
        lines.push(feature.geometry.coordinates as [number, number][])
      } else if (feature.geometry.type === 'MultiLineString') {
        const multi = feature.geometry.coordinates as [number, number][][]
        lines.push(...multi)
      }
    })

    const allArrows: { position: [number, number]; bearing: number }[] = []
    lines.forEach((line) => {
      allArrows.push(...getArrowPoints(line, spacing))
    })

    return allArrows
  }, [route.geojson])

  if (arrows.length === 0) return null

  // Ensure high contrast readability by modifying the arrow slightly if it's identical to route color.
  // Actually, white is usually the best for route overlays. Let's make it a bright white/off-white arrow 
  // with a slight color tint.
  const arrowColor = '#ffffff'

  return (
    <>
      {arrows.map((arr, idx) => (
        <Marker
          key={`arrow-${idx}`}
          position={arr.position}
          icon={createArrowIcon(arr.bearing, arrowColor)}
          interactive={false} // Don't block clicks from hitting polyline or map underneath
        />
      ))}
    </>
  )
}
