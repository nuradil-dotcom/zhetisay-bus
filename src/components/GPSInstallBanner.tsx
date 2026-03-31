import { useState, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'

/** True when running as an installed PWA (no browser chrome). */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

interface GPSInstallBannerProps {
  /** Called when the user taps the install CTA — opens the OnboardingModal */
  onInstallTap: () => void
}

/**
 * Persistent thin banner shown at the very top of the screen for users who:
 *  1. Are NOT in standalone PWA mode, and
 *  2. Have already seen and dismissed the first-launch OnboardingModal.
 *
 * Behaviour:
 *  - The "×" button hides the banner for the current view only (React state).
 *  - Every time the user returns to the tab (visibilitychange → visible),
 *    the banner re-appears. This is intentional: it acts as a persistent
 *    reminder that GPS is restricted in the browser.
 *  - z-index 9998: the UpdateBanner (z-index 9999) will slide over the top
 *    of this banner when an update is ready, hiding it temporarily.
 */
export default function GPSInstallBanner({ onInstallTap }: GPSInstallBannerProps) {
  const { t } = useLang()
  const [dismissed, setDismissed] = useState(false)

  // Re-show the banner every time the user switches back to the tab.
  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden) {
        setDismissed(false)
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  // Never show in standalone PWA mode or if dismissed this view.
  if (isStandalone()) return null
  if (dismissed) return null

  // Only show for users who already went through the first-launch modal.
  // (New users see the big OnboardingModal instead — no double nudge.)
  const hasSeenOnboarding = !!localStorage.getItem('zholda_hasVisited')
  if (!hasSeenOnboarding) return null

  return (
    <div
      className="fixed left-0 right-0 flex items-stretch z-[9998]"
      style={{
        top: 0,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Yellow left accent stripe */}
      <div className="w-1 flex-shrink-0" style={{ background: '#FFD700' }} />

      {/* Main tappable area */}
      <button
        className="flex-1 flex items-center gap-2 px-3 py-2.5 text-left active:opacity-80 transition-opacity"
        style={{ background: '#1e1e1f' }}
        onClick={onInstallTap}
        aria-label="Install app for full GPS"
      >
        <span
          className="text-xs font-semibold leading-tight flex-1"
          style={{ color: '#e5e5e5', fontFamily: 'Inter, sans-serif' }}
        >
          {t('gps_banner_text')}
        </span>
        <span
          className="text-xs font-bold flex-shrink-0"
          style={{ color: '#FFD700', fontFamily: 'Inter, sans-serif' }}
        >
          {t('gps_banner_cta')}
        </span>
      </button>

      {/* Dismiss button — hides until next tab focus */}
      <button
        className="flex-shrink-0 flex items-center justify-center px-3 active:opacity-60 transition-opacity"
        style={{ background: '#1e1e1f' }}
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M1 1L13 13M13 1L1 13"
            stroke="#6b7280"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
