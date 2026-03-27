import { useState } from 'react'
import { ArrowLeft, Delete, Loader } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import type { AuthResult } from '../lib/supabase'
import type { DriverAuth } from '../types'

interface DriverPINModalProps {
  onSuccess: (auth: DriverAuth) => void
  onClose: () => void
  /** Async function that verifies the PIN against Supabase */
  onVerify: (pin: string) => Promise<AuthResult>
}

type ErrorKind = 'wrong_pin' | 'already_active' | null

export default function DriverPINModal({ onSuccess, onClose, onVerify }: DriverPINModalProps) {
  const { t } = useLang()
  const [pin, setPin] = useState('')
  const [errorKind, setErrorKind] = useState<ErrorKind>(null)
  const [loading, setLoading] = useState(false)

  const handleKey = (digit: string) => {
    if (pin.length >= 4 || loading) return
    const next = pin + digit
    setPin(next)
    setErrorKind(null)
    if (next.length === 4) setTimeout(() => verify(next), 120)
  }

  const handleDelete = () => {
    if (loading) return
    setPin((p) => p.slice(0, -1))
    setErrorKind(null)
  }

  const verify = async (code: string) => {
    setLoading(true)
    const result = await onVerify(code)
    setLoading(false)

    if (result.status === 'ok') {
      onSuccess(result.data)
    } else {
      setErrorKind(result.status)
      setPin('')
    }
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'] as const

  const subLabels: Record<string, string> = {
    '2': 'ABC', '3': 'DEF', '4': 'GHI', '5': 'JKL',
    '6': 'MNO', '7': 'PGRS', '8': 'TUV', '9': 'WXYZ',
  }

  const errorMsg =
    errorKind === 'already_active'
      ? t('pin_already_active')
      : errorKind === 'wrong_pin'
        ? t('wrong_pin')
        : null

  const dotColor =
    errorKind === 'already_active' ? '#f97316' : errorKind === 'wrong_pin' ? '#ef4444' : '#FFD700'

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col" style={{ background: '#1A1A1B' }}>
      {/* Header */}
      <div className="flex items-center px-5 pt-14 pb-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="text-white p-1 -ml-1 active:opacity-60 transition-opacity disabled:opacity-30"
          aria-label={t('back')}
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-6">
        <h1
          className="text-white font-bold text-3xl mt-4 mb-10"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          {t('enter_pin_title')}
        </h1>

        {/* PIN dots */}
        <div className="flex gap-6 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div
                className="w-5 h-5 rounded-full transition-all duration-150"
                style={{
                  background: i < pin.length ? dotColor : 'transparent',
                  boxShadow:
                    i < pin.length && !errorKind
                      ? '0 0 8px rgba(255,215,0,0.6)'
                      : 'none',
                }}
              />
              <div
                className="h-0.5 w-14 rounded transition-colors"
                style={{
                  background: i < pin.length ? dotColor : '#4B5563',
                }}
              />
            </div>
          ))}
        </div>

        {/* Error message */}
        {errorMsg && (
          <p
            className="text-sm mb-4 leading-snug"
            style={{
              color: errorKind === 'already_active' ? '#f97316' : '#ef4444',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {errorMsg}
          </p>
        )}

        <button
          onClick={() => verify(pin)}
          disabled={pin.length < 4 || loading}
          className="w-full h-14 rounded-2xl font-bold text-base text-black transition-opacity disabled:opacity-40 active:opacity-80 flex items-center justify-center gap-2"
          style={{ background: '#FFD700', fontFamily: 'Inter, sans-serif' }}
        >
          {loading ? (
            <><Loader size={18} className="animate-spin" /> {t('verifying')}</>
          ) : (
            t('verify')
          )}
        </button>
      </div>

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-px bg-gray-200 border-t border-gray-200 mt-6">
        {keys.map((key, idx) => {
          if (key === '') return <div key={idx} className="bg-gray-100 h-20" />
          if (key === 'del') {
            return (
              <button
                key={idx}
                onPointerDown={handleDelete}
                disabled={loading}
                className="bg-gray-100 h-20 flex items-center justify-center active:bg-gray-200 transition-colors disabled:opacity-40"
              >
                <Delete size={26} className="text-gray-700" />
              </button>
            )
          }
          return (
            <button
              key={idx}
              onPointerDown={() => handleKey(key)}
              disabled={loading}
              className="bg-white h-20 flex flex-col items-center justify-center gap-0.5 active:bg-gray-100 transition-colors disabled:opacity-40"
            >
              <span className="text-gray-900 font-medium text-3xl leading-none">{key}</span>
              {subLabels[key] && (
                <span className="text-gray-400 text-[10px] tracking-widest mt-0.5">
                  {subLabels[key]}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
