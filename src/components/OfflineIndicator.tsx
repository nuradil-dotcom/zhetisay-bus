import { WifiSlash as WifiOff } from '@phosphor-icons/react'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useLang } from '../context/LanguageContext'

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const { t } = useLang()
  if (isOnline) return null

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1100] flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
      <span className="w-2 h-2 bg-white rounded-full animate-pulse flex-shrink-0" />
      <WifiOff size={12} />
      <span>{t('offline_mode')}</span>
    </div>
  )
}
