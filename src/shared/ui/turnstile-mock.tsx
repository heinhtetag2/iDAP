import { useState } from 'react'
import { cn } from '@/shared/lib'

interface TurnstileMockProps {
  onVerify: (token: string) => void
  className?: string
}

export function TurnstileMock({ onVerify, className }: TurnstileMockProps) {
  const [state, setState] = useState<'idle' | 'verifying' | 'verified'>('idle')

  const handleClick = () => {
    if (state !== 'idle') return
    setState('verifying')
    setTimeout(() => {
      setState('verified')
      onVerify('mock-turnstile-token-' + Math.random().toString(36).slice(2))
    }, 900)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 select-none',
        className,
      )}
    >
      {/* Checkbox area */}
      <button
        type="button"
        onClick={handleClick}
        disabled={state === 'verifying' || state === 'verified'}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 transition-all',
          state === 'verified'
            ? 'border-success-500 bg-success-500'
            : 'border-gray-400 hover:border-primary-500',
        )}
      >
        {state === 'verifying' && (
          <span className="block h-3 w-3 animate-spin rounded-full border-2 border-gray-400 border-t-primary-600" />
        )}
        {state === 'verified' && (
          <svg className="h-4 w-4 text-white" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className="flex-1 text-sm text-text-primary">
        {state === 'verified' ? 'Verified' : "I'm not a robot"}
      </span>

      {/* Cloudflare branding placeholder */}
      <div className="flex flex-col items-center gap-0.5 opacity-50">
        <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-orange-500">
          <span className="text-[9px] font-bold text-white">CF</span>
        </div>
        <span className="text-[9px] text-text-muted leading-none">Turnstile</span>
      </div>
    </div>
  )
}
