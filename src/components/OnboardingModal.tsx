import { useState, useEffect } from 'react'
import { useLang } from '../context/LanguageContext'

const STORAGE_KEY = 'zhetisaybus_hasVisited'

/** True when the app is running as an installed PWA (standalone window, no browser chrome). */
function isRunningStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

export default function OnboardingModal() {
  const { t } = useLang()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Never show the install tutorial when already installed as a PWA.
    if (isRunningStandalone()) return
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

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
        className="w-full rounded-t-3xl flex flex-col items-center px-6 pt-6 pb-10 safe-bottom"
        style={{ background: '#1A1A1B', maxWidth: 480 }}
      >
        {/* Video placeholder */}
        <div
          className="relative w-full rounded-2xl mb-6 overflow-hidden flex items-center justify-center"
          style={{ aspectRatio: '16/9', background: '#2a2a2b' }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLVideoElement).style.display = 'none' }}
          >
            <source src="/onboarding.mp4" type="video/mp4" />
          </video>
          {/* Fallback shown while video file is absent */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl font-black shadow-lg"
              style={{ background: '#FFD700', color: '#1A1A1B' }}
            >
              Z
            </div>
            <span className="text-white font-bold text-lg">Zhetisay Bus</span>
          </div>
        </div>

        {/* Instructions — bilingual always shown */}
        <div className="text-center mb-6 space-y-1">
          <p className="text-white font-semibold text-base leading-snug">
            {t('onboarding_instruction_ru')}
          </p>
          <p className="text-gray-400 text-sm leading-snug">
            {t('onboarding_instruction_kz')}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            {t('onboarding_ios_hint')}
          </p>
        </div>

        <button
          onClick={dismiss}
          className="w-full h-14 rounded-2xl font-bold text-base text-black active:opacity-80 transition-opacity"
          style={{ background: '#FFD700', fontFamily: 'Inter, sans-serif' }}
        >
          {t('understood')}
        </button>
      </div>
    </div>
  )
}
