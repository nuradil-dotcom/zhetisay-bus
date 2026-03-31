import { useLang } from '../context/LanguageContext'

interface GPSInstallBannerProps {
  isVisible: boolean
  onDismiss: () => void
  onInstallTap: () => void
}

/**
 * Persistent thin banner shown at the very top of the screen for users who:
 *  1. Are NOT in standalone PWA mode, and
 *  2. Have already seen and dismissed the first-launch OnboardingModal.
 *
 * It is managed by App.tsx which handles the session visibility and re-triggering.
 */
export default function GPSInstallBanner({ isVisible, onDismiss, onInstallTap }: GPSInstallBannerProps) {
  const { t } = useLang()

  if (!isVisible) return null

  return (
    <div
      className="fixed left-0 right-0 flex items-stretch z-[9998] shadow-md transition-transform"
      style={{
        top: 0,
        paddingTop: 'env(safe-area-inset-top, 0px)',
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
          className="text-xs font-bold whitespace-nowrap flex-shrink-0"
          style={{ color: '#FFD700', fontFamily: 'Inter, sans-serif' }}
        >
          {t('gps_banner_cta')}
        </span>
      </button>

      {/* Dismiss button */}
      <button
        className="flex-shrink-0 flex items-center justify-center px-3 active:opacity-60 transition-opacity"
        style={{ background: '#1e1e1f' }}
        onClick={onDismiss}
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

