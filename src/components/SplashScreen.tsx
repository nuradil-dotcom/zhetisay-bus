import { useEffect, useState } from 'react'

interface SplashScreenProps {
  onDone: () => void
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
      className="fixed inset-0 z-[4000] flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        background: '#1A1A1B',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* City skyline at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden opacity-20 pointer-events-none select-none">
        <svg viewBox="0 0 480 120" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <rect x="10" y="60" width="18" height="60" fill="#888" />
          <rect x="14" y="40" width="10" height="20" fill="#888" />
          <rect x="35" y="30" width="30" height="90" fill="#888" />
          <rect x="38" y="20" width="8" height="10" fill="#888" />
          <rect x="70" y="50" width="20" height="70" fill="#888" />
          <rect x="95" y="20" width="40" height="100" fill="#999" />
          <rect x="110" y="5" width="10" height="15" fill="#999" />
          <rect x="140" y="40" width="25" height="80" fill="#888" />
          <rect x="170" y="55" width="15" height="65" fill="#888" />
          <rect x="190" y="25" width="35" height="95" fill="#999" />
          <rect x="203" y="10" width="8" height="15" fill="#999" />
          <rect x="230" y="45" width="20" height="75" fill="#888" />
          <rect x="255" y="30" width="28" height="90" fill="#888" />
          <rect x="288" y="50" width="18" height="70" fill="#888" />
          <rect x="310" y="20" width="38" height="100" fill="#999" />
          <rect x="323" y="8" width="10" height="12" fill="#999" />
          <rect x="352" y="40" width="22" height="80" fill="#888" />
          <rect x="378" y="55" width="16" height="65" fill="#888" />
          <rect x="398" y="28" width="32" height="92" fill="#999" />
          <rect x="434" y="45" width="20" height="75" fill="#888" />
          <rect x="458" y="60" width="18" height="60" fill="#888" />
        </svg>
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center gap-5 z-10">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl"
          style={{ background: '#FFD700' }}
        >
          <span
            className="font-black text-5xl select-none"
            style={{ color: '#1A1A1B', fontFamily: 'Inter, sans-serif', letterSpacing: '-2px' }}
          >
            Z
          </span>
        </div>
        <p
          className="text-white font-bold text-3xl tracking-tight"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Zhetisay Bus
        </p>
      </div>
    </div>
  )
}
