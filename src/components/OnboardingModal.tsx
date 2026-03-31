import { useState, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

const STORAGE_KEY = 'zholda_hasVisited'

/** True when the app is running as an installed PWA (standalone window, no browser chrome). */
function isRunningStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function isIOS(): boolean {
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua)
}

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent)
}

interface OnboardingModalProps {
  forceOpenSignal?: number
}

export default function OnboardingModal({ forceOpenSignal = 0 }: OnboardingModalProps) {
  const { t } = useLang()
  const { isInstallable, handleInstall } = useInstallPrompt()
  const [visible, setVisible] = useState(false)
  const ios = isIOS()
  const android = isAndroid()

  useEffect(() => {
    // Never show the install tutorial when already installed as a PWA.
    if (isRunningStandalone()) return
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  useEffect(() => {
    if (forceOpenSignal > 0 && !isRunningStandalone()) {
      setVisible(true)
    }
  }, [forceOpenSignal])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[3000] flex flex-col items-center justify-end"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full rounded-t-3xl flex flex-col items-center px-6 pt-6 pb-10 safe-bottom overflow-y-auto"
        style={{ background: '#1A1A1B', maxWidth: 480, maxHeight: '92vh' }}
      >
        {/* iOS only: onboarding video slot */}
        {ios && (
          <div
            className="relative mx-auto rounded-2xl mb-6 overflow-hidden flex items-center justify-center w-full"
            style={{ maxHeight: '45vh', background: '#2a2a2b' }}
          >
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-auto h-full object-contain mx-auto"
              style={{ maxHeight: '45vh' }}
              onCanPlay={(e) => {
                const placeholder = (e.target as HTMLVideoElement)
                  .parentElement
                  ?.querySelector<HTMLElement>('[data-placeholder]')
                if (placeholder) placeholder.style.display = 'none'
              }}
              onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none' }}
            >
              <source src="/onboarding.mp4" type="video/mp4" />
            </video>
            {/* Loading placeholder — hidden once video is ready */}
            <div
              data-placeholder
              className="absolute inset-0 flex items-center justify-center pointer-events-none px-4"
            >
              <p
                className="text-center text-gray-400 text-sm font-medium"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {t('video_loading')}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center mb-6 space-y-1">
          <p className="text-white font-semibold text-base leading-snug">
            {t('onboarding_instruction')}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            {t('onboarding_ios_hint')}
          </p>
          <p className="text-yellow-300 text-xs mt-2 font-semibold">
            {t('onboarding_safari_gps_hint')}
          </p>
        </div>

        {/* Android only: native Chrome install prompt button */}
        {android && isInstallable && (
          <button
            onClick={() => { void handleInstall() }}
            className="w-full h-14 rounded-2xl font-bold text-base text-black active:opacity-80 transition-opacity mb-3"
            style={{ background: '#FFD700', fontFamily: 'Inter, sans-serif' }}
          >
            {t('install_app')}
          </button>
        )}

        <button
          onClick={dismiss}
          className="w-full h-14 rounded-2xl font-bold text-base text-white active:opacity-80 transition-opacity"
          style={{ background: '#374151', fontFamily: 'Inter, sans-serif' }}
        >
          {t('understood')}
        </button>
      </div>
    </div>
  )
}
