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
- Deployed on **Vercel** (GitHub repo: nuradil-dotcom/zhetisay-bus, branch: main)
- Supabase project URL: https://yvllgdftgrbeyojefimk.supabase.co

## Project structure
src/
  App.tsx                  — root component, state orchestration, route selection/search integration
  components/
    MapView.tsx            — Leaflet map, routes, bus markers, search pin
    BusMarker.tsx          — animated LERP bus icon (30s interpolation)
    UserLocationMarker.tsx — direction-aware teardrop user location icon
    RoutePolyline.tsx      — glowing route polyline renderer
    BusInfoCard.tsx        — compact single-row floating pill for selected bus
    BottomSheet.tsx        — draggable sheet with recommended/live cards + Route 2 waypoint section
    SearchBar.tsx          — Photon + Nominatim geocoder with transliteration and walk-distance context pill
    DriverModeScreen.tsx   — full-screen GPS broadcast UI (accuracy + last-upload age)
    DriverPINModal.tsx     — PIN entry with numpad (wrong/already_active handling)
    DriverToggle.tsx       — small indicator when driver is broadcasting
    HamburgerMenu.tsx      — side menu: routes, language, driver controls
    LocateMeButton.tsx     — locate-me toggle button (yellow when active)
    OnboardingModal.tsx    — first-launch onboarding (Android install CTA, iOS video slot)
    InstallButton.tsx      — global Android install banner (beforeinstallprompt)
    OfflineIndicator.tsx   — offline status pill
    SplashScreen.tsx       — launch splash with static app logo image
    UpdateBanner.tsx       — PWA update banner + visibility-triggered SW update check
  hooks/
    useGeolocation.ts      — driver GPS watcher, route snapping, Route 2 leg switch at pivot, Supabase upload
    useVehicles.ts         — fetches + realtime-subscribes to active vehicles
    useDeviceHeading.ts    — compass heading via DeviceOrientationEvent
    useInstallPrompt.ts    — beforeinstallprompt/appinstalled management (`isInstallable`, `handleInstall`)
    useOnlineStatus.ts     — navigator.onLine watcher
  lib/
    supabase.ts            — Supabase client and data operations
    mockData.ts            — hardcoded routes, bounds, landmarks, Route 2 pivot, Route 2 visual waypoints
    routeSnapping.ts       — route snapping helpers for LineString/MultiLineString + per-leg snapping
    lerp.ts                — lerpLatLng(), haversineMeters()
    i18n.ts                — translations KZ / RU / EN (+ APP_NAME constant)
  context/
    LanguageContext.tsx    — language switcher context
  types/index.ts           — VehicleLocation, BusRoute, BusStop, DriverAuth, etc.

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
- Route snapping supports **LineString and MultiLineString**
- Route 2 directional model:
  - Route 2 geometry is a **MultiLineString** with two legs (northbound/southbound)
  - `ROUTE_2_PIVOT` (Поликлиника) is used to switch active snapping leg when within 50 m
  - While on Route 2, snapping is constrained to the currently active leg
- Search/geocoder:
  - Photon + Nominatim with Cyrillic↔Latin transliteration and deduplication
  - Walk distance from searched location to nearest route point
  - Search context pill is fully localized via i18n keys (`route`, `recommended_nearest`, `meter_abbr`, `walk_on_foot`)
- ETA logic:
  - Live ETA uses 25 km/h average speed
  - BottomSheet waypoint section includes Route 2 visual nodes (`ROUTE_WAYPOINTS`)
  - When online: waypoint ETA shown with LIVE badge
  - When offline: shows next scheduled Bazaar departure (20-min intervals from 08:00)
- BottomSheet UX:
  - Hero card + regular cards + draggable handle behavior
  - Expanded section with clickable waypoints
- BusInfoCard redesigned into compact single-row pill:
  - keeps top route color accent bar
  - inline layout with route badge/name + compact show-route + close button
  - removed old divider/fare/live/update rows
- PWA/install/update flow:
  - `useInstallPrompt` manages installability state and native install trigger
  - Android onboarding shows localized yellow install button when installable (`install_app`)
  - iOS onboarding shows `onboarding.mp4` slot (autoplay/loop/muted/playsInline)
  - Onboarding warning + instruction text are localized (`onboarding_instruction`, `onboarding_safari_gps_hint`, `onboarding_ios_hint`, `understood`)
  - UpdateBanner checks SW updates on `visibilitychange` when user returns to app
- Language and translation policy updates:
  - Default app language is `kz` (`LanguageContext` fallback is validated to `kz` when stored value is invalid)
  - UI follows single-language rendering based on selected menu language (KZ/RU/EN)
  - Remaining mixed/hardcoded UI labels in `OnboardingModal`, `InstallButton`, `BottomSheet`, `SearchBar`, `DriverPINModal`, `DriverModeScreen`, `HamburgerMenu`, and `App` fallbacks were moved to `t()`
  - Added i18n keys: `install_app`, `waypoints`, `menu`, `back`, `soon`, `meter_abbr`, `km_abbr`, `next_departure_bazaar`, `recommended_nearest`, `walk_on_foot`, `city_name`, `verifying`
- Branding pivot to **Zholda** completed in runtime surfaces:
  - `<title>`, Apple web-app title, root HTML Open Graph meta tags, PWA manifest name/short_name
  - major UI headers/footer labels updated
  - splash/menu logo surfaces use `/pwa-512.png`
- PWA icon assets are present:
  - `/public/pwa-192.png`
  - `/public/pwa-512.png`
  - `/public/apple-touch-icon.png`

## Current PWA configuration
- Manifest is generated by `vite-plugin-pwa` in `vite.config.ts` (no static `manifest.json` in repo)
- `name`: `Zholda`
- `short_name`: `Zholda`
- `theme_color`: `#FFD700`
- `background_color`: `#FFD700`
- icons:
  - `/pwa-192.png` (192x192)
  - `/pwa-512.png` (512x512, maskable purpose)
- Root HTML metadata (`index.html`) is hardcoded (not language-dynamic):
  - `<title>`: `Zholda`
  - `theme-color`: `#FFD700`
  - `meta description`: `Автобустарды тікелей эфирде бақылау және ресми кестелер.`
  - `og:title`: `Zholda — Жетісай автобустары`
  - `og:description`: `Автобустарды тікелей эфирде бақылау және ресми кестелер.`
  - `og:image`: `/og-image.png`

## What's next / TODO
- [ ] Add `/public/onboarding.mp4` final production file (if not yet provided)
- [ ] Add final `/public/og-image.png` asset file (1200×630 recommended) to match existing hardcoded OG meta path
- [ ] Revisit "Where am I?" flow to optionally trigger nearest-route recommendation like search does
- [ ] Improve ETA realism (route-progress aware ETA vs straight-line-only estimate)
- [ ] Add proper bus stop model (coordinates + routeId + radius + KZ/RU/EN labels)
- [ ] Build timetable dataset and schedule engine for non-live fallback quality
- [ ] Normalize stop naming variants for more robust search matching

## Known issues / decisions
- **iOS Safari GPS limitation**: background/permission behavior is inconsistent in browser mode; installed PWA provides better reliability.
- **Hardcoded route data**: Routes are in `mockData.ts`; no admin route management UI yet.
- **Anonymous passenger model**: no user accounts; drivers authenticate via PIN only (MVP scope).
- **Upload cadence**: 30s interval intentionally conserves quota; map can lag by up to ~30s between true fixes.
- **Snapping threshold**: snapping only applies within ~50 m of route geometry; beyond that, raw GPS is retained.
- **Route 2 snapping state**: leg switch is one-way per active driver session (leg 0 → leg 1 at pivot reach).
- **`bus_number` strictness**: must be exactly `'1'` or `'2'` to match route IDs/numbers.
- **No global store**: state remains in `App.tsx` via React hooks.
- **Tailwind setup**: uses `@tailwindcss/vite` plugin (not PostCSS Tailwind plugin).
- **Brand yellow token**: `#FFD700` is canonical; avoid `yellow-400` (`#FACC15`).
- **Coordinate order**: GeoJSON uses `[lng, lat]`, Leaflet runtime APIs use `{ lat, lng }`.