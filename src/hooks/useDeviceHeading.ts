import { useState, useEffect, useCallback, useRef } from 'react'

interface UseDeviceHeadingResult {
  heading: number | null        // 0–360 degrees, 0 = north, clockwise
  supported: boolean
  permissionState: 'unknown' | 'granted' | 'denied' | 'needs_request'
  requestPermission: () => void // iOS 13+ only — call from a user tap
}

/**
 * Subscribes to the device compass via DeviceOrientationEvent.
 *
 * Platform notes:
 *   iOS 13+   → requires explicit permission via DeviceOrientationEvent.requestPermission()
 *               permissionState will be 'needs_request' until the user taps to grant.
 *   Android   → prefers `deviceorientationabsolute` (true compass north) over
 *               `deviceorientation` (arbitrary reference frame).
 *   Desktop   → not supported (heading stays null).
 *
 * Accuracy improvements vs the previous version:
 *   1. `deviceorientationabsolute` is prioritized — its `alpha` is already relative
 *      to magnetic north, so `(360 − alpha) % 360` is correct.
 *   2. Plain `deviceorientation` without `absolute=true` is now IGNORED — using it
 *      with the same formula would produce wrong results (arbitrary reference).
 *   3. EMA low-pass filter (α = 0.15) smooths the rapid jitter that comes from
 *      the magnetometer firing at ~60 fps, without introducing much lag.
 *
 * heading is null when:
 *   - Device doesn't support orientation events
 *   - iOS permission has not been granted yet
 *   - No calibrated compass fix has been received yet
 */

/** Low-pass filter weight: lower = smoother but laggier, higher = snappier. */
const EMA_ALPHA = 0.15

/** Circular EMA that handles the 0°/360° wrap correctly. */
function circularEma(prev: number, next: number, alpha: number): number {
  // Work in radians to avoid the 359° → 1° wrap
  const prevRad = (prev * Math.PI) / 180
  const nextRad = (next * Math.PI) / 180
  // Compute angular difference in [-π, π]
  let diff = nextRad - prevRad
  if (diff > Math.PI) diff -= 2 * Math.PI
  if (diff < -Math.PI) diff += 2 * Math.PI
  const smoothedRad = prevRad + alpha * diff
  return ((smoothedRad * 180) / Math.PI + 360) % 360
}

export function useDeviceHeading(): UseDeviceHeadingResult {
  const [heading, setHeading] = useState<number | null>(null)
  const [supported, setSupported] = useState(false)
  const [permissionState, setPermissionState] = useState<
    'unknown' | 'granted' | 'denied' | 'needs_request'
  >('unknown')

  // Track which source won so we don't mix readings from both events
  const absoluteReceivedRef = useRef(false)
  const smoothedHeadingRef = useRef<number | null>(null)

  // ── iOS (webkitCompassHeading) ──────────────────────────────────────────
  // Always true magnetic north, already corrected — just smooth it.
  const handleIosHeading = useCallback((raw: number) => {
    smoothedHeadingRef.current =
      smoothedHeadingRef.current === null
        ? raw
        : circularEma(smoothedHeadingRef.current, raw, EMA_ALPHA)
    setHeading(Math.round(smoothedHeadingRef.current))
  }, [])

  // ── Android absolute (deviceorientationabsolute) ────────────────────────
  // `alpha` here is relative to true magnetic north (0 = north, CW).
  // Convert to compass heading: (360 − alpha) % 360.
  const handleAbsoluteHeading = useCallback((alpha: number) => {
    absoluteReceivedRef.current = true
    const raw = (360 - alpha) % 360
    smoothedHeadingRef.current =
      smoothedHeadingRef.current === null
        ? raw
        : circularEma(smoothedHeadingRef.current, raw, EMA_ALPHA)
    setHeading(Math.round(smoothedHeadingRef.current))
  }, [])

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      // iOS path: webkitCompassHeading is always available on iOS and is
      // pre-corrected for magnetic declination by the OS.
      const iosHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading
      if (iosHeading !== undefined && iosHeading !== null) {
        handleIosHeading(iosHeading)
        return
      }

      // For a plain `deviceorientation` event: only trust alpha when the event
      // explicitly declares itself absolute. If absolute=false (or undefined),
      // alpha is relative to an arbitrary start orientation, NOT compass north.
      if (e.alpha !== null && e.absolute) {
        // This device fires `deviceorientation` with absolute=true (some Androids do);
        // treat it the same as the `deviceorientationabsolute` event.
        if (!absoluteReceivedRef.current) {
          handleAbsoluteHeading(e.alpha)
        }
      }
      // If absolute is false/null, we discard this reading entirely to avoid
      // showing a heading that drifts relative to where the page was loaded.
    },
    [handleIosHeading, handleAbsoluteHeading]
  )

  const handleOrientationAbsolute = useCallback(
    (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        handleAbsoluteHeading(e.alpha)
      }
    },
    [handleAbsoluteHeading]
  )

  const startListening = useCallback(() => {
    setSupported(true)
    setPermissionState('granted')
    // `deviceorientationabsolute` fires events that are always compass-north-relative.
    // Listening to both means iOS (which fires `deviceorientation` with webkitCompassHeading)
    // and Android (which fires `deviceorientationabsolute`) are both covered.
    window.addEventListener(
      'deviceorientationabsolute',
      handleOrientationAbsolute as EventListener,
      true
    )
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true)
  }, [handleOrientation, handleOrientationAbsolute])

  const requestPermission = useCallback(() => {
    // Only needed on iOS 13+
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }
    if (typeof DOE.requestPermission === 'function') {
      DOE.requestPermission()
        .then((state) => {
          if (state === 'granted') {
            startListening()
          } else {
            setPermissionState('denied')
          }
        })
        .catch(() => setPermissionState('denied'))
    } else {
      // Android / non-iOS — no permission required
      startListening()
    }
  }, [startListening])

  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setSupported(false)
      return
    }

    setSupported(true)

    // Check if iOS permission is required
    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>
    }

    if (typeof DOE.requestPermission === 'function') {
      // iOS 13+ — user must tap a button to trigger requestPermission
      setPermissionState('needs_request')
    } else {
      // Android / desktop — start immediately
      startListening()
    }

    return () => {
      window.removeEventListener(
        'deviceorientationabsolute',
        handleOrientationAbsolute as EventListener,
        true
      )
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true)
    }
  }, [startListening, handleOrientation, handleOrientationAbsolute])

  return { heading, supported, permissionState, requestPermission }
}
