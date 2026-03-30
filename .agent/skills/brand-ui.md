# SKILL: Brand & UI Guardian
# TRIGGER: When modifying components, CSS, UI, animations, or styling.

## Design System & Typography
- **Primary Brand Yellow:** `#FFD700`. Do NOT use Tailwind's default `yellow-400`.
- **Primary Background/Dark:** `#1A1A1B`. Use this for high-contrast dark modes, drawer backgrounds, and heavy text. Do not use generic grays.
- **Fonts:** - General UI: **Inter** (via Google Fonts).
  - Brand/Headers: **Revalia** (`.splash-brand-title` or `font-revalia`).

## Component Layout Rules (CRITICAL)
- **BottomSheet Waypoints:**
  - *No Bus Selected:* Show waypoints grouped by Route 1 and Route 2.
  - *Bus Selected:* Filter the list to show ONLY the waypoints for that specific bus's route.
- **Search Bar (`SearchBar.tsx`):**
  - Empty query = Empty space below the bar. 
  - DO NOT implement hardcoded "quick hub" pills under the search bar.
  - Matches must merge Photon API results with our internal `ROUTE_WAYPOINTS`.
- **Hamburger Menu:**
  - The "Stops" section must be a Route-based accordion, not a flat list.