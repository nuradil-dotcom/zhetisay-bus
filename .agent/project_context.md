# Zholda - Master Project Context
**Project:** Real-time marshrutka tracking PWA for Zhetisay, Kazakhstan.

## Tech Stack & Architecture (STRICT)
- **Framework:** React 19 + TypeScript (Vite 8).
- **Styling:** Tailwind CSS v4 (via `@tailwindcss/vite`). DO NOT use PostCSS or legacy Tailwind configs.
- **Map Engine:** React-Leaflet v5 + Leaflet 1.9 (OpenStreetMap tiles).
- **Backend/DB:** Supabase (Postgres + Realtime subscriptions + anonymous auth).
- **PWA:** `vite-plugin-pwa`. Update logic is aggressively tied to `visibilitychange` and `focus` events.
- **Icons:** Strictly `lucide-react`.

## Global State & Data Flow
- **No Global Store:** State is managed purely in `App.tsx` via React hooks. Do not introduce Redux, Zustand, or Context unless explicitly ordered.
- **Language Policy:** Strict single-language mode. Default is Kazakh (`kz`). ALL UI strings must use the `t()` hook from `i18n.ts`. Do not hardcode English or Russian.
- **Coordinate Systems:** - GeoJSON / `mockData.ts` uses `[lng, lat]`.
  - Leaflet runtime APIs use `{ lat, lng }`.
  - Never mix these up.