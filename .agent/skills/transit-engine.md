# SKILL: Transit & GPS Engine
# TRIGGER: When modifying Geolocation, Supabase logic, ETAs, or Driver/Passenger status.

## Driver Tracking (Hardware Priority)
- Drivers authenticate via PIN.
- Driver `watchPosition` MUST use strict hardware accuracy to prevent ghost trailing: `{ enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }`.
- Broadcast interval is 30 seconds to conserve Supabase quota.

## Passenger ETA & Freshness Logic (`gpsPingStatus.ts`)
- **ETA Math:** Hardcoded assumption of 25 km/h straight-line speed.
- **Status Evaluation (Age = Date.now() - vehicle.last_updated):**
  - `Age <= 60s`: Display green "LIVE" badge + calculate live ETA.
  - `Age > 60s` AND within 100m of `BAZAAR_COORDS`: Display gray `gps_status_waiting` badge. Hide live ETA.
  - `Age > 60s` AND NOT at Bazaar: Display red `gps_status_no_signal` badge. Hide live ETA.

## Offline Fallbacks
- If no live bus is available for Route 2, fallback to the `Bazaar timetable` UI.
- If no live bus is available for Route 1, output an em dash ("—") as no timetable exists yet.