import { useEffect, useState, type CSSProperties } from 'react'

interface SplashScreenProps {
  onDone: () => void
}

/** Bottom band height: fixed vertical slice; image tiles on X when viewport is wider than one tile. */
const SKYLINE_BAND_STYLE: CSSProperties = {
  height: 'clamp(200px, 30vh, 320px)',
  backgroundImage: 'url(/bg-city.png)',
  backgroundRepeat: 'repeat-x',
  backgroundPosition: 'left bottom',
  backgroundSize: 'auto 100%',
  opacity: 0.42,
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1800)
    const doneTimer = setTimeout(() => onDone(), 2400)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(doneTimer)
    }
  }, [onDone])

  return (
    <div
      className="fixed inset-0 z-[4000] flex flex-col transition-opacity duration-500"
      style={{
        background: '#1A1A1B',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Logo + title: centered in space above skyline (reads higher than full-viewport center) */}
      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center -translate-y-8">
        <div className="flex flex-col items-center gap-5">
          <img
            src="/pwa-512.png"
            alt="Zholda logo"
            className="h-24 w-24 rounded-3xl object-cover shadow-2xl"
          />
          <p className="splash-brand-title text-3xl font-normal tracking-tight text-white">
            Zholda
          </p>
        </div>
      </div>

      {/* Skyline: own row at bottom; repeat-x tiles on wide screens (left/right edges should match for seamless joins) */}
      <div
        className="pointer-events-none relative z-0 w-full flex-shrink-0 select-none"
        style={SKYLINE_BAND_STYLE}
        aria-hidden
      />
    </div>
  )
}
