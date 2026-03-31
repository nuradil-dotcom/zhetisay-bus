import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
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
  const [show, setShow] = useState(false)

  // Wait 3 seconds before showing so it doesn't overlap with the Splash Screen
  useEffect(() => {
    if (!isVisible) {
      setShow(false)
      return
    }
    const timer = setTimeout(() => setShow(true), 3000)
    return () => clearTimeout(timer)
  }, [isVisible])

  if (!show) return null

  return (
    <div
      className="fixed z-[9998] left-4 right-4 flex items-stretch shadow-xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500"
      style={{
        top: 'calc(env(safe-area-inset-top, 16px) + 16px)',
        background: 'rgba(30, 30, 31, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Yellow left accent stripe */}
      <div className="w-1.5 flex-shrink-0" style={{ background: '#FFD700' }} />

      {/* Main tappable area */}
      <button
        className="flex-1 flex items-center gap-2 px-3 py-3 text-left active:opacity-80 transition-opacity"
        onClick={onInstallTap}
        aria-label="Install app for full GPS"
      >
        <span
          className="text-xs font-semibold leading-tight flex-1"
          style={{ color: '#F3F4F6', fontFamily: 'Inter, sans-serif' }}
        >
          {t('gps_banner_text')}
        </span>
        <span
          className="text-xs font-bold whitespace-nowrap flex-shrink-0 bg-[#FFD700] text-[#1A1A1B] px-2 py-1 rounded-full"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {t('gps_banner_cta')}
        </span>
      </button>

      {/* Dismiss button */}
      <button
        className="flex-shrink-0 flex items-center justify-center px-3 active:opacity-60 transition-opacity"
        onClick={onDismiss}
        aria-label="Dismiss banner"
      >
        <X size={18} color="#9CA3AF" />
      </button>
    </div>
  )
}

