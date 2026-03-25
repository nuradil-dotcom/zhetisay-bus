# Zholda / Zhetisay Bus — Project Context

## What we're building
A real-time marshrutka (minibus) tracking PWA for Zhetisay city, Turkestan Region, Kazakhstan.
Passengers open the app to see live bus locations on a map and get ETAs.
Drivers open it, enter a PIN, and broadcast their GPS location every 30 seconds.
The app name is tentatively "Zholda" (Kazakh: "on the road").

## Current stack
- **React 19** + **TypeScript** (Vite 8)
- **Tailwind CSS v4** (via @tailwindcss/vite)
- **React-Leaflet v5** + **Leaflet 1.9** — interactive map (OpenStreetMap tiles)
- **Supabase** — Postgres DB + Realtime subscriptions + anonymous auth
- **vite-plugin-pwa** — Service worker, offline caching, installable PWA
- **Lucide React** — icons
- **Framer Motion** — installed but not yet heavily used
- Deployed on **Vercel** (GitHub repo: nuradil-dotcom/zhetisay-bus, branch: main)
- Supabase project URL: https://yvllgdftgrbeyojefimk.supabase.co

## Project structure
src/
  App.tsx                  — root component, all state orchestration
  components/
    MapView.tsx            — Leaflet map, routes, bus markers, search pin
    BusMarker.tsx          — animated LERP bus icon (30s interpolation)
    UserLocationMarker.tsx — direction-aware teardrop user location icon
    RoutePolyline.tsx      — triple-layer glowing route polyline
    BusInfoCard.tsx        — floating white card when bus is tapped
    BottomSheet.tsx        — draggable sheet with live bus list + ETAs
    SearchBar.tsx          — Photon + Nominatim geocoder with transliteration
    DriverModeScreen.tsx   — full-screen GPS broadcast UI for drivers
    DriverPINModal.tsx     — PIN entry with numpad (handles wrong/already_active)
    DriverToggle.tsx       — small indicator when driver is broadcasting
    HamburgerMenu.tsx      — side menu: routes, language, driver login
    LocateMeButton.tsx     — locate-me toggle button (yellow = active)
    OnboardingModal.tsx    — first-launch install instructions modal
    InstallButton.tsx      — Android Chrome "Install App" banner
    OfflineIndicator.tsx   — offline status pill
    SplashScreen.tsx       — launch splash
  hooks/
    useGeolocation.ts      — driver GPS watcher + route snapping + Supabase upload
    useVehicles.ts         — fetches + Realtime-subscribes to active vehicles
    useDeviceHeading.ts    — compass heading via DeviceOrientationEvent
    useInstallPrompt.ts    — beforeinstallprompt (Android Chrome install)
    useOnlineStatus.ts     — navigator.onLine watcher
  lib/
    supabase.ts            — Supabase client, fetchVehicles, authenticateDriver (AuthResult union), updateDriverLocation, setVehicleActive, subscribeToVehicles
    mockData.ts            — MOCK_ROUTES (Route 1 + Route 2 GeoJSON), ZHETISAY_CENTER/BOUNDS, landmarks
    routeSnapping.ts       — snapToRoute() — snaps GPS coord to nearest point on LineString
    lerp.ts                — lerpLatLng(), haversineMeters()
    i18n.ts                — translations KZ / RU / EN
  context/
    LanguageContext.tsx    — language switcher context
  types/index.ts           — VehicleLocation, BusRoute, BusStop, DriverAuth, AuthResult, etc.

## Supabase schema (vehicles table)
- id (uuid)
- bus_number (text) — "1" or "2", matches route IDs in mockData
- latitude, longitude (float8)
- last_updated (timestamptz)
- is_active (bool)
- driver_pin (text) — plain text PIN e.g. "7777"

## What's done ✅
- Live map with real-time bus locations via Supabase Realtime
- Bus markers with LERP animation (smooth 30s interpolation between GPS fixes)
- Route polylines with triple-layer glow effect (active routes only)
- Driver mode: PIN auth → GPS broadcast → Supabase updates every 30s
- First GPS fix uploaded immediately (not after 30s delay)
- Route snapping: driver GPS snapped to nearest road point before upload
- GPS accuracy filter: fixes with reported accuracy > 50m are discarded (no garbage uploads)
- Route GeoJSON densified: Route 1 (244 waypoints) + Route 2 (185 waypoints) — accurate road-following at corners/curves
- One-driver-one-phone restriction: is_active + last_updated staleness check (5 min)
- Passenger "Where Am I?" button — locate + fly to position (toggle: re-tap removes dot)
- Direction-aware user location marker (teardrop arrow, DeviceOrientationEvent compass)
- Geocoder search (Photon + Nominatim, Cyrillic↔Latin transliteration, deduplication)
- Walk distance from searched address to nearest route point
- ETA calculation (bus distance / 25 km/h average speed)
- BottomSheet with hero card (recommended route) + regular bus cards
- BusInfoCard (white card floating above sheet): fare chip, LIVE badge, Show Route button
- "Show Route" button reliably fits map to full route extent on every tap (MapController deduplication bug fixed)
- HamburgerMenu: route viewer (bus count fixed after bus_number data correction), language switcher (KZ/RU/EN), driver login
- PWA: installable, offline map tile caching (30 days), Supabase NetworkFirst cache
- iOS safe-area-inset-top applied to SearchBar and DriverModeScreen (no status bar conflict)
- iOS font-size 16px on search input (prevents auto-zoom on focus)
- GPS error handling: PERMISSION_DENIED stops session, TIMEOUT/UNAVAILABLE keeps watching
- GPS error feedback: clear toast messages on "Where Am I?" failure
- DriverModeScreen shows specific message for permission-denied vs transient errors
- Safari GPS fix: watchPosition called synchronously (no async before it)
- i18n for all error states (KZ/RU/EN)
- OnboardingModal (first-launch, shows once, has video slot at /public/onboarding.mp4)
- Git repo initialized and pushed to GitHub, Vercel auto-deploy on main

## What's next / TODO
- [ ] Provide PWA icon assets: /public/pwa-192.png, /public/pwa-512.png, /public/apple-touch-icon.png
- [ ] Provide /public/onboarding.mp4 (screen recording of Share → Add to Home Screen)
- [ ] Rebuild OnboardingModal into platform-aware install prompt (detect standalone vs browser, iOS vs Android)
- [ ] Fix "Where Am I?" + walk distance: should also trigger findClosestRoute (currently only search bar triggers it)
- [ ] Add more bus routes to mockData.ts as they are mapped
- [ ] Consider app name: "Zholda" (leading candidate), "Zhol", or "Sapar"
- [ ] OG image (1200×630) for link previews in WhatsApp/Telegram
- [ ] Consider: ETA based on actual bus position, not just straight-line distance

## Known issues / decisions made
- **Safari browser GPS**: iOS Safari resets geolocation permission aggressively. GPS features only work reliably via the installed PWA (home screen icon). This is an Apple platform limitation, not a code bug. The app shows a helpful error message directing users to Settings when blocked.
- **Route data is hardcoded**: Routes 1 and 2 GeoJSON coordinates are in mockData.ts. No route management UI exists yet. Adding a new route = editing mockData.ts manually. Both routes are now densely traced (180–250 waypoints each) for accurate road-snapping.
- **No user accounts**: Passengers are fully anonymous. Drivers authenticate only by PIN stored in the vehicles table (plain text). No auth system needed at this scale.
- **GPS upload interval**: 30 seconds (conservative to save Supabase quota). First fix is uploaded immediately. The 30s interval means bus position can lag up to 30s on the passenger map.
- **LERP interpolation**: Bus markers animate smoothly between the last known position and the new one over 30 seconds, so they appear to move continuously even though updates are only every 30s.
- **Route snapping threshold**: snapToRoute() only snaps if GPS is within ~50m of the route line. Beyond 50m, raw GPS is used (avoids wild snapping when bus is off-route). Additionally, fixes with device-reported accuracy > 50m are discarded entirely before snapping.
- **bus_number must be exactly '1' or '2'**: The Supabase vehicles table `bus_number` column must contain the plain strings `'1'` or `'2'` (no prefix, no spaces). These match the `id` and `number` fields in MOCK_ROUTES. Any mismatch silently breaks route display, bus counts in the menu, and ETA calculations.
- **AuthResult discriminated union**: authenticateDriver() returns { status: 'ok'|'wrong_pin'|'already_active' } — not a simple null. DriverPINModal.onVerify must accept this type.
- **No Redux/Zustand**: All state in App.tsx via useState/useCallback. Simple enough that a global store is not needed yet.
- **Tailwind v4**: Uses @tailwindcss/vite plugin, not PostCSS plugin. Config is in index.css via @theme block.
- **GeoJSON coordinate order**: Leaflet uses [lat, lng], GeoJSON uses [lng, lat]. All route coordinates in mockData are [lng, lat] per GeoJSON spec. haversineMeters and snapToRoute expect { lat, lng } objects.