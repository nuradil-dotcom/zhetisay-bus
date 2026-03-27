import { useState, useEffect } from 'react'
import type { BeforeInstallPromptEvent } from '../types'

interface UseInstallPromptResult {
  isInstallable: boolean
  handleInstall: () => Promise<void>
  canInstall: boolean
  triggerInstall: () => Promise<void>
  isInstalled: boolean
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!prompt) return
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
      setPrompt(null)
    }
  }

  return {
    isInstallable: !!prompt && !isInstalled,
    handleInstall,
    canInstall: !!prompt && !isInstalled,
    triggerInstall: handleInstall,
    isInstalled,
  }
}
