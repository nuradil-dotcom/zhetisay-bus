import { Component, type ReactNode, type ErrorInfo } from 'react'

/**
 * Detects the user's preferred language without relying on LanguageContext
 * (which may have crashed). Falls back to Kazakh (the app default).
 */
function detectLang(): 'kz' | 'ru' | 'en' {
  const lang = (navigator.language ?? '').toLowerCase()
  if (lang.startsWith('ru')) return 'ru'
  if (lang.startsWith('en')) return 'en'
  return 'kz'
}

const MESSAGES = {
  kz: {
    title: 'Қолданба қатесі',
    body: 'Іске қосу кезінде күтпеген қате пайда болды. Бетті жаңартып, қайталаңыз.',
    button: 'Қолданбаны қайта іске қосу',
  },
  ru: {
    title: 'Ошибка приложения',
    body: 'При запуске произошла непредвиденная ошибка. Перезагрузите страницу.',
    button: 'Перезапустить приложение',
  },
  en: {
    title: 'App error',
    body: 'An unexpected error occurred during startup. Please reload the page.',
    button: 'Reload App',
  },
}

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: null }
  }

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : String(error)
    return { hasError: true, errorMessage: msg }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary] Fatal render error:', error, info.componentStack)

    // Forcibly hide the splash screen if it is still visible, so the user
    // never sees a stuck loading state over a broken app shell.
    const splash = document.querySelector<HTMLElement>('[data-splash]')
    if (splash) {
      splash.style.display = 'none'
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const lang = detectLang()
    const msg = MESSAGES[lang]

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#1A1A1B',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif',
          zIndex: 9999,
        }}
      >
        {/* Brand logo */}
        <img
          src="/pwa-512.png"
          alt="Zholda"
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            marginBottom: 24,
            opacity: 0.7,
          }}
        />

        {/* Error title */}
        <h1
          style={{
            color: '#FFD700',
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          {msg.title}
        </h1>

        {/* Error body */}
        <p
          style={{
            color: '#9ca3af',
            fontSize: 14,
            lineHeight: 1.6,
            textAlign: 'center',
            maxWidth: 300,
            marginBottom: 24,
          }}
        >
          {msg.body}
        </p>

        {/* Technical detail (collapsed, dev-friendly) */}
        {this.state.errorMessage && (
          <p
            style={{
              color: '#6b7280',
              fontSize: 11,
              fontFamily: 'monospace',
              background: '#111112',
              border: '1px solid #2a2a2b',
              borderRadius: 8,
              padding: '8px 12px',
              maxWidth: 320,
              wordBreak: 'break-all',
              marginBottom: 28,
              textAlign: 'left',
            }}
          >
            {this.state.errorMessage.slice(0, 200)}
          </p>
        )}

        {/* Reload button */}
        <button
          onClick={this.handleReload}
          style={{
            background: '#FFD700',
            color: '#1A1A1B',
            border: 'none',
            borderRadius: 16,
            padding: '14px 32px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
            maxWidth: 280,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {msg.button}
        </button>
      </div>
    )
  }
}
