import { useEffect, useRef } from 'react'
import { ArrowsClockwise } from '@phosphor-icons/react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useLang } from '../context/LanguageContext'

/**
 * Sticky banner shown when a new service-worker version is waiting to activate.
 * Appears at the very top of the screen (above the search bar) so it is
 * immediately visible on all devices, including installed PWAs.
 *
 * Tapping "Refresh" sends SKIP_WAITING to the new SW, then reloads the page
 * so the fresh assets are served immediately.
 *
 * A visibilitychange listener calls registration.update() whenever the user
 * returns to the app tab so the SW checks for a new version proactively.
 */
export default function UpdateBanner() {
  const { t } = useLang()
  const registrationRef = useRef<ServiceWorkerRegistration | undefined>(undefined)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      registrationRef.current = registration
    },
  })

  useEffect(() => {
    // Trigger an SW update check every time the user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void registrationRef.current?.update()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also poll every 60 minutes so long-lived open tabs catch updates
    const intervalId = window.setInterval(() => {
      void registrationRef.current?.update()
    }, 60 * 60 * 1000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.clearInterval(intervalId)
    }
  }, [])

  if (!needRefresh) return null

  return (
    <div
      className="fixed left-0 right-0 z-[9999] flex items-center justify-between gap-3 px-4"
      style={{
        top: 0,
        background: '#FFD700',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 12,
      }}
    >
      <span
        className="text-sm font-bold leading-snug flex-1"
        style={{ color: '#1A1A1B', fontFamily: 'Inter, sans-serif' }}
      >
        {t('update_available')}
      </span>

      <button
        onClick={() => updateServiceWorker(true)}
        className="flex-shrink-0 flex items-center gap-1.5 rounded-xl font-bold text-xs px-3 py-2 active:opacity-70 transition-opacity"
        style={{ background: '#1A1A1B', color: '#FFD700', fontFamily: 'Inter, sans-serif' }}
      >
        <ArrowsClockwise size={13} weight="bold" />
        {t('update_refresh')}
      </button>
    </div>
  )
}
