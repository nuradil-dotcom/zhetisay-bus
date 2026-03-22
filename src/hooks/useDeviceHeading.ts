import { useState, useEffect, useCallback } from 'react'

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
 *   Android   → works immediately, no permission prompt needed.
 *   Desktop   → not supported (heading stays null).
 *
 * heading is null when:
 *   - Device doesn't support orientation
 *   - iOS permission has not been granted yet
 *   - The event fires but alpha is null (rare)
 */
export function useDeviceHeading(): UseDeviceHeadingResult {
  const [heading, setHeading] = useState<number | null>(null)
  const [supported, setSupported] = useState(false)
  const [permissionState, setPermissionState] = useState<
    'unknown' | 'granted' | 'denied' | 'needs_request'
  >('unknown')

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    // iOS provides webkitCompassHeading (already compass-corrected, 0 = north)
    const iosHeading = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
      .webkitCompassHeading

    if (iosHeading !== undefined && iosHeading !== null) {
      setHeading(Math.round(iosHeading))
      return
    }

    // Android: alpha is rotation around Z axis (0 = north on some, device-dependent).
    // Convert: compass heading = (360 - alpha) % 360
    if (e.alpha !== null && e.absolute) {
      setHeading(Math.round((360 - e.alpha) % 360))
      return
    }

    // Fallback for Android devices that don't set absolute=true
    if (e.alpha !== null) {
      setHeading(Math.round((360 - e.alpha) % 360))
    }
  }, [])

  const startListening = useCallback(() => {
    setSupported(true)
    setPermissionState('granted')
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true)
    window.addEventListener('deviceorientation', handleOrientation as EventListener, true)
  }, [handleOrientation])

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
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true)
      window.removeEventListener('deviceorientation', handleOrientation as EventListener, true)
    }
  }, [startListening, handleOrientation])

  return { heading, supported, permissionState, requestPermission }
}
