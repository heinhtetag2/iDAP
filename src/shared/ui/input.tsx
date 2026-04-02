import * as React from 'react'
import { cn } from '@/shared/lib/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
  label?: string
  dark?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, id, dark, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-1.5',
              dark ? 'text-white/70' : 'text-text-primary'
            )}
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            dark
              ? [
                  'border-white/10 bg-white/5 text-white placeholder:text-white/25',
                  'focus-visible:ring-sky-500 focus-visible:border-sky-500',
                  error && 'border-red-500/50 focus-visible:ring-red-500',
                ]
              : [
                  'border-border bg-surface text-text-primary placeholder:text-text-muted',
                  'focus-visible:ring-primary-500 focus-visible:border-primary-500',
                  error && 'border-danger-500 focus-visible:ring-danger-500',
                ],
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className={cn('mt-1 text-xs', dark ? 'text-red-400' : 'text-danger-500')}>{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
