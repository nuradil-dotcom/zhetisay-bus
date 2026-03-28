# Zholda — Project Context

## What we're building
A real-time marshrutka (minibus) tracking PWA for Zhetisay city, Turkestan Region, Kazakhstan.
Passengers open the app to see live bus locations on a map and get ETAs.
Drivers open it, enter a PIN, and broadcast their GPS location every 30 seconds.
Current production brand name in UI/PWA metadata is **Zholda**.

## Current stack
- **React 19** + **TypeScript** (Vite 8)
- **Tailwind CSS v4** (via @tailwindcss/vite)
- **React-Leaflet v5** + **Leaflet 1.9** — interactive map (OpenStreetMap tiles)
- **Supabase** — Postgres DB + Realtime subscriptions + anonymous auth
- **vite-plugin-pwa** — service worker, offline caching, installable PWA
- **Lucide React** — icons
- **Framer Motion** — installed but not yet heavily used
- **Typography** — **Inter** (UI, Google Fonts, `display=swap`) + **Revalia** (brand wordmark on splash + drawer header via `font-revalia` / `.splash-brand-title`); Latin Revalia `.woff2` preloaded in `index.html` for fast first paint
- Deployed on **Vercel** (GitHub repo: nuradil-dotcom/zhetisay-bus, branch: main)
- Supabase project URL: https://yvllgdftgrbeyojefimk.supabase.co

## Project structure
src/
  App.tsx                  — root state: map, search, menu, driver mode, `handleStopsWaypointSelect` (Stops → route polyline + search pin + flyTo only; no fitBounds), onboarding reopen signal
  components/
    MapView.tsx            — Leaflet map, routes, bus markers, search pin; `MapController` flyTo vs fitBounds
    BusMarker.tsx          — animated LERP bus icon (30s interpolation)
    UserLocationMarker.tsx — direction-aware teardrop user location icon
    RoutePolyline.tsx      — glowing route polyline renderer
    BusInfoCard.tsx        — compact single-row floating pill for selected bus
    BottomSheet.tsx        — draggable sheet: bus cards with GPS freshness badges + waypoint area grouped by route when no bus selected; single route when a bus is selected (`WAYPOINTS_H` / `SHEET_H` sized accordingly)
    SearchBar.tsx          — Photon + Nominatim only; instant matches against `ROUTE_WAYPOINTS` (Route 2 nodes); no quick-hub landmark pills
    DriverModeScreen.tsx   — full-screen GPS broadcast UI (accuracy + last-upload age)
    DriverPINModal.tsx     — PIN entry with numpad (wrong/already_active handling)
    DriverToggle.tsx       — small indicator when driver is broadcasting
    HamburgerMenu.tsx      — language, driver, all routes, **Stops** (per-route accordion + waypoint → map), **Zholda** title next to logo uses Revalia (`font-revalia`); browser-only install CTA → onboarding
    LocateMeButton.tsx     — locate-me toggle (passenger `getCurrentPosition`; options unchanged from longer timeout / cache)
    OnboardingModal.tsx    — first-launch + `forceOpenSignal` from menu install button; iOS video slot; `immediate: true` on SW register via hook
    InstallButton.tsx      — Android install banner (`beforeinstallprompt`)
    OfflineIndicator.tsx   — offline status pill
    SplashScreen.tsx       — launch splash: logo + **Zholda** (`.splash-brand-title` → Revalia only); bottom **skyline** band `/bg-city.png` via CSS `background-repeat: repeat-x` + `background-size: auto 100%` (tiles on wide viewports); column layout (logo centered above band, `-translate-y-8` nudge)
    UpdateBanner.tsx       — SW update prompt; aggressive `registration.update()` + `registration.waiting` sync on visibility, focus, mount
  hooks/
    useGeolocation.ts      — driver `watchPosition` (strict accuracy options), route snapping, Route 2 leg switch, Supabase upload
    useVehicles.ts         — fetches + realtime-subscribes to active vehicles
    useDeviceHeading.ts    — compass heading via DeviceOrientationEvent
    useInstallPrompt.ts    — beforeinstallprompt/appinstalled management (`isInstallable`, `handleInstall`)
    useOnlineStatus.ts     — navigator.onLine watcher
  lib/
    supabase.ts            — Supabase client and data operations
    mockData.ts            — routes, bounds, landmarks, `BAZAAR_COORDS` / `ZHETISAY_CENTER` / bazaar waypoint node (single hub lat-lng); Route 2 pivot, `ROUTE_WAYPOINTS`, `ROUTE_1_WAYPOINTS`, `ROUTE_WAYPOINTS_BY_ROUTE_ID` (route polylines are separate from hub pin)
    gpsPingStatus.ts       — passenger UI: GPS ping age vs bazaar radius → live / waiting / no signal
    routeSnapping.ts       — route snapping helpers for LineString/MultiLineString + per-leg snapping
    lerp.ts                — lerpLatLng(), haversineMeters()
    i18n.ts                — translations KZ / RU / EN (+ APP_NAME constant)
  context/
    LanguageContext.tsx    — language switcher context
  index.css                — Tailwind `@theme` (`--font-sans`, `--font-revalia`), `.splash-brand-title` (Revalia, no synthesis), global + Leaflet tweaks
  types/index.ts           — VehicleLocation, BusRoute, BusStop, DriverAuth, etc.

Root `index.html` — Google Fonts (Inter + Revalia, `display=swap`), preload Latin Revalia woff2 (versioned gstatic URL); PWA meta (see **Current PWA configuration**).

## Supabase schema (vehicles table)
- id (uuid)
- bus_number (text) — `"1"` or `"2"`, matches route IDs in mock data
- latitude, longitude (float8)
- last_updated (timestamptz)
- is_active (bool)
- driver_pin (text) — plain text PIN (MVP tradeoff)

## What's implemented ✅
- Live map with realtime bus locations via Supabase Realtime
- Bus markers with smooth 30s LERP interpolation between GPS fixes
- Driver mode: PIN auth → GPS watch → Supabase updates every 30s
- First GPS fix uploads immediately (no initial 30s wait)
- GPS quality guard: fixes with reported accuracy > 50 m are ignored
- **Driver `watchPosition` options** (strict hardware / no cache): `{ enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }` — shorter timeout may surface more transient `TIMEOUT` indoors; codes 2/3 still keep watching per existing logic
- Route snapping supports **LineString and MultiLineString**
- Route 2 directional model:
  - Route 2 geometry is a **MultiLineString** with two legs (northbound/southbound)
  - `ROUTE_2_PIVOT` (Поликлиника) is used to switch active snapping leg when within 50 m
  - While on Route 2, snapping is constrained to the currently active leg
- Search/geocoder:
  - Photon + Nominatim with Cyrillic↔Latin transliteration and deduplication
  - **No** fixed quick-hub landmark chips under the bar; area under search stays empty when query is empty
  - Instant suggestions: substring match on **`ROUTE_WAYPOINTS`** names only (Route 2 visual nodes), merged with API results
  - Walk distance from searched location to nearest route point
  - Search context pill localized via i18n (`route`, `recommended_nearest`, `meter_abbr`, `walk_on_foot`)
- **Passenger GPS freshness (BottomSheet bus cards + waypoint ETA badge)** — `lib/gpsPingStatus.ts` + `vehicle.updatedAt` vs `BAZAAR_COORDS` (100 m):
  - ≤60 s and active → green live badge + live ETA as before
  - More than 60 s at bazaar → gray “waiting” (`gps_status_waiting`); hide live ETA
  - More than 60 s not at bazaar → red “no signal” (`gps_status_no_signal`); hide live ETA
  - 1 s ticker in sheet so age updates without new realtime rows
- **BottomSheet waypoint area (expanded section)**:
  - **General** (no bus selected): section header `t('waypoints')`; then **Route 1** label (`t('route')` + id) + horizontal pill row, then **Route 2** label + pill row; route-colored labels and left accent bar on pills; ETA uses **closest on-route bus with active GPS** to the tapped waypoint
  - **Selected bus** (sheet or map): **only that vehicle’s route** is shown (other route hidden); route header + single pill row; ETA uses **only the selected vehicle**; invalid waypoint cleared when selection route mismatches
  - Scroll: waypoint labels/pills in a scrollable block; ETA / offline timetable row pinned below with light top border
  - Offline: Route 2 waypoints still show Bazaar timetable fallback; Route 1 shows em dash when no live data
  - Layout: `WAYPOINTS_H` = 188px; `SHEET_H` includes it (affects `--bs-visible` / LocateMeButton offset)
- ETA model (unchanged): straight-line distance at **25 km/h** for live estimates; not route-progress-aware
- BottomSheet UX: hero card + regular cards + draggable handle; expanded waypoint block height per `WAYPOINTS_H` above
- BusInfoCard: compact single-row pill with show-route + dismiss
- **Hamburger menu — Stops (`bus_stops`)**:
  - Per-route accordion: **Route 1** / **Route 2** (`t('route')` + number), expand to list waypoints from `ROUTE_WAYPOINTS_BY_ROUTE_ID`
  - Waypoint tap → `onStopsWaypointSelect`: set **active route** (polyline visible), **`setSearchLocation`** (same yellow search pin as geocoder), **`flyToTarget`** at zoom 16 — **no** `fitBounds`; clears `recommendedRouteId` / `searchWalkDistance`; closes drawer
- **Hamburger menu — install (browser only)**:
  - Footer button uses `t('install_app')` (KZ copy: **Қолданбаны орнату**); hidden when `display-mode: standalone` or iOS `navigator.standalone`
  - Opens existing onboarding modal via `forceOpenSignal` from `App.tsx` (`OnboardingModal`)
- PWA/install/update flow:
  - `useInstallPrompt` + `InstallButton` / onboarding Android CTA
  - **UpdateBanner**: `useRegisterSW({ immediate: true })`; on register and whenever tab is visible (`visibilitychange` + `window` `focus`) runs `registration.update()`; if `registration.waiting` exists, sets `needRefresh` immediately (no reliance on missing `waiting` event); cleans up pending timeouts where applicable
- Language: default `kz`; UI via `t()`; i18n includes `gps_status_waiting`, `gps_status_no_signal`, `install_app`, `waypoints`, `update_*`, etc. Legacy keys `quick_hub_*` / `soon` remain in `i18n.ts` but are **not** used by `SearchBar` / Stops UI anymore
- Branding **Zholda** on title, manifest, OG, splash + drawer logo `/pwa-512.png`; wordmark uses **Revalia** (splash: `.splash-brand-title`; menu header: `font-revalia`)
- Splash skyline asset: **`/public/bg-city.png`** (expected; tile horizontally seamless left/right for best `repeat-x` look)
- PWA icons present: `/public/pwa-192.png`, `/public/pwa-512.png`, `/public/apple-touch-icon.png`

## Current PWA configuration
- Manifest is generated by `vite-plugin-pwa` in `vite.config.ts` (no static `manifest.json` in repo)
- `registerType`: `prompt` (user confirms refresh via UpdateBanner)
- `name` / `short_name`: `Zholda`
- `theme_color` / `background_color`: `#FFD700`
- icons: `/pwa-192.png`, `/pwa-512.png` (maskable)
- Root HTML metadata (`index.html`) is hardcoded (not language-dynamic): title, theme-color, description, OG tags, `og:image`: `/og-image.png`; Google Fonts stylesheet + Revalia preload (gstatic URL is version-specific and may need updating if Google changes the font file path)

## What's next / TODO
- [ ] Ensure `/public/bg-city.png` is committed for splash skyline (repo may only list favicon/icons until added)
- [ ] Add `/public/onboarding.mp4` final production file (if not yet provided)
- [ ] Add final `/public/og-image.png` asset file (1200×630 recommended) to match existing hardcoded OG meta path
- [ ] Revisit "Where am I?" flow to optionally trigger nearest-route recommendation like search does (passenger `getCurrentPosition` still uses its own options, not driver strict set)
- [ ] Improve ETA realism (route-progress aware ETA vs straight-line-only estimate)
- [ ] Add proper bus stop model (coordinates + routeId + radius + KZ/RU/EN labels); align `ROUTE_*_WAYPOINTS` with that model when ready
- [ ] Build timetable dataset and schedule engine for non-live fallback (Route 1 offline currently has no schedule string)
- [ ] Normalize stop naming variants for more robust search matching
- [ ] Optional: remove unused i18n keys (`quick_hub_*`, `soon`) if desired for housekeeping

## Known issues / decisions
- **iOS Safari GPS limitation**: background/permission behavior is inconsistent in browser mode; installed PWA provides better reliability.
- **Driver watch `timeout: 5000`**: favors fresh fixes; may increase `TIMEOUT` frequency when the lock is slow — session still continues for non-permission errors.
- **Hardcoded route data**: Routes and waypoint nodes are in `mockData.ts`; no admin route management UI yet.
- **Anonymous passenger model**: no user accounts; drivers authenticate via PIN only (MVP scope).
- **Upload cadence**: 30s interval intentionally conserves quota; map can lag by up to ~30s between true fixes.
- **Snapping threshold**: snapping only applies within ~50 m of route geometry; beyond that, raw GPS is retained.
- **Route 2 snapping state**: leg switch is one-way per active driver session (leg 0 → leg 1 at pivot reach).
- **`bus_number` strictness**: must be exactly `'1'` or `'2'` to match route IDs/numbers.
- **No global store**: state remains in `App.tsx` via React hooks.
- **Tailwind setup**: uses `@tailwindcss/vite` plugin (not PostCSS Tailwind plugin).
- **Brand yellow token**: `#FFD700` is canonical; avoid `yellow-400` (`#FACC15`).
- **Coordinate order**: GeoJSON uses `[lng, lat]`, Leaflet runtime APIs use `{ lat, lng }`.
- **Splash skyline tiling**: `repeat-x` + `auto 100%` height; visible seams if `bg-city.png` left/right edges do not match.
- **Revalia preload URL** in `index.html` points at a specific `fonts.gstatic.com` path; if fonts break after a Google CDN update, refresh the link from the current `css2?family=Revalia` response.
