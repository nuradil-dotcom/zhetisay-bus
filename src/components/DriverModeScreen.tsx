import { Menu, Navigation, NavigationOff, X, Radio } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { useState, useEffect } from 'react'
import type { LatLng } from '../types'

interface DriverModeScreenProps {
  busNumber: string
  isRouteActive: boolean
  gpsPosition: LatLng | null
  gpsAccuracy: number | null
  lastUploadAt: Date | null
  gpsError: string | null
  onStartRoute: () => void
  onStopRoute: () => void
  onExitDriverMode: () => void
  onMenuClick: () => void
}

export default function DriverModeScreen({
  busNumber,
  isRouteActive,
  gpsPosition,
  gpsAccuracy,
  lastUploadAt,
  gpsError,
  onStartRoute,
  onStopRoute,
  onExitDriverMode,
  onMenuClick,
}: DriverModeScreenProps) {
  const { t } = useLang()
  const [uploadAge, setUploadAge] = useState<number | null>(null)

  useEffect(() => {
    if (!lastUploadAt) { setUploadAge(null); return }
    const tick = () => setUploadAge(Math.floor((Date.now() - lastUploadAt.getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [lastUploadAt])

  const hasGps = !!gpsPosition && !gpsError

  return (
    <div
      className="fixed inset-0 z-[900] flex flex-col"
      style={{ background: '#1A1A1B' }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between px-5 pb-4 safe-top"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 28px)' }}
      >
        <button
          onClick={onMenuClick}
          className="w-11 h-11 flex items-center justify-center rounded-full active:opacity-60 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          aria-label="Menu"
        >
          <Menu size={20} className="text-white" />
        </button>

        <button
          onClick={onExitDriverMode}
          className="flex items-center gap-1.5 px-4 h-9 rounded-full active:opacity-60 transition-opacity"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <X size={14} className="text-gray-400" />
          <span
            className="text-gray-400 text-sm font-medium"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {t('driver_exit')}
          </span>
        </button>
      </div>

      {/* ── Center content ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-8">

        {/* Bus badge */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(255,215,0,0.12)', border: '2px solid rgba(255,215,0,0.3)' }}
          >
            <span
              className="font-black text-4xl"
              style={{ color: '#FFD700', fontFamily: 'Inter, sans-serif' }}
            >
              {busNumber}
            </span>
          </div>
          <p
            className="text-white font-semibold text-lg"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {t('route')} {busNumber}
          </p>
        </div>

        {/* GPS status */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background: gpsError ? '#ef4444' : hasGps ? '#22c55e' : '#FFD700',
                boxShadow: hasGps ? '0 0 6px rgba(34,197,94,0.6)' : 'none',
              }}
            />
            <span
              className="text-sm font-medium"
              style={{ color: gpsError ? '#ef4444' : hasGps ? '#22c55e' : '#9CA3AF', fontFamily: 'Inter, sans-serif' }}
            >
              {gpsError
                ? (gpsError === 'permission_denied' || gpsError.toLowerCase().includes('denied')
                  ? t('gps_permission_denied')
                  : t('gps_error'))
                : hasGps
                  ? t('driver_gps_on')
                  : t('driver_gps_off')}
            </span>
            {hasGps && (
              <span className="text-gray-600 text-xs tabular-nums">
                {gpsAccuracy != null && `±${gpsAccuracy} м`}
                {gpsAccuracy != null && uploadAge != null && ' · '}
                {uploadAge != null && `${t('uploaded')} ${uploadAge} ${t('sec_abbr')}`}
              </span>
            )}
          </div>
          {/* Guidance subtitle for permission-denied errors */}
          {gpsError && (gpsError === 'permission_denied' || gpsError.toLowerCase().includes('denied')) && (
            <p
              className="text-xs text-center px-6"
              style={{ color: '#ef4444', fontFamily: 'Inter, sans-serif', maxWidth: 280, opacity: 0.85 }}
            >
              {t('gps_permission_denied')}
            </p>
          )}
        </div>

        {/* Hint text */}
        {!isRouteActive && (
          <p
            className="text-gray-500 text-sm text-center leading-relaxed"
            style={{ fontFamily: 'Inter, sans-serif', maxWidth: 260 }}
          >
            {t('driver_screen_hint')}
          </p>
        )}

        {/* Live indicator */}
        {isRouteActive && (
          <div className="flex items-center gap-2">
            <Radio size={16} style={{ color: '#22c55e' }} />
            <span
              className="font-bold text-sm tracking-wide"
              style={{ color: '#22c55e', fontFamily: 'Inter, sans-serif' }}
            >
              {t('broadcasting_active')}
            </span>
          </div>
        )}

        {/* Big start / stop button */}
        <button
          onClick={isRouteActive ? onStopRoute : onStartRoute}
          className="w-full h-20 rounded-3xl font-black text-2xl flex items-center justify-center gap-3 transition-opacity active:opacity-80"
          style={{
            background: isRouteActive ? '#ef4444' : '#FFD700',
            color: isRouteActive ? 'white' : '#1A1A1B',
            fontFamily: 'Inter, sans-serif',
            maxWidth: 360,
          }}
        >
          {isRouteActive ? (
            <><NavigationOff size={28} /> {t('stop_route')}</>
          ) : (
            <><Navigation size={28} /> {t('start_route')}</>
          )}
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="px-8 pb-10 text-center">
        <p className="text-gray-700 text-xs">
          Zholda · {t('driver_mode_active')}
        </p>
      </div>
    </div>
  )
}
