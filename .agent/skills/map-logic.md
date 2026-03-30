# SKILL: Map & Geometry Architect
# TRIGGER: When modifying Leaflet, Polylines, Markers, MapView, or Routing.

## Marker Animation (No Teleporting)
- `BusMarker.tsx` MUST use a **5-second** LERP (Linear Interpolation) animation to glide between old and new GPS coordinates. This matches the 5-second driver broadcast cadence (`setInterval` in `useGeolocation.ts`).
- **Snap threshold (300 m):** Before starting the LERP, calculate `haversineMeters(displayPos, newPosition)`. If the distance exceeds **300 metres**, cancel any active animation and **snap instantly** to the new coordinate. This prevents slow post-offline crawling across the map. The constant is `SNAP_THRESHOLD_METERS = 300` at the top of `BusMarker.tsx`.

## Route Snapping & Pivot Logic
- Route 2 is a `MultiLineString` with two legs (Northbound and Southbound).
- Snapping is constrained strictly to the active leg within a 50m threshold. Beyond 50m, display the raw GPS coordinate.
- `ROUTE_2_PIVOT` (Поликлиника) is the exact coordinate used to switch the active leg from leg 0 to leg 1.

## Map Camera UX
- When a user selects a waypoint from the menu, the map must execute a two-step animation:
  1. `fitBounds` to show the route.
  2. A `1050ms` timeout before executing `flyToTarget` to center on the specific waypoint (prevents map whiplash).