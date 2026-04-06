import { useEffect, useRef, useCallback } from 'react'

/**
 * Screen Wake Lock API hook.
 * Prevents the screen from dimming or locking while active.
 */
export function useWakeLock(isActive: boolean) {
  const wakeLockRef = useRef<any>(null)

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return

    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
      console.log('Wake Lock is active')
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`)
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
      console.log('Wake Lock released')
    }
  }, [])

  useEffect(() => {
    if (isActive) {
      requestWakeLock()
    } else {
      releaseWakeLock()
    }

    // Handle re-acquiring wake lock when the page becomes visible again
    const handleVisibilityChange = async () => {
      if (isActive && wakeLockRef.current !== null && document.visibilityState === 'visible') {
        await requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [isActive, requestWakeLock, releaseWakeLock])
}
