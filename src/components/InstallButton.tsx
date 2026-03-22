import { Download } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallButton() {
  const { canInstall, triggerInstall } = useInstallPrompt()
  if (!canInstall) return null

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[1050] px-4 pb-6 pt-2 bg-gradient-to-t from-black/30 to-transparent pointer-events-none">
      <button
        onClick={triggerInstall}
        className="pointer-events-auto w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-bold text-base text-black shadow-xl active:scale-98 transition-transform"
        style={{ background: '#FFD700', fontFamily: 'Inter, sans-serif' }}
      >
        <Download size={20} />
        УСТАНОВИТЬ ПРИЛОЖЕНИЕ
      </button>
    </div>
  )
}
