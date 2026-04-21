import { cn } from '@/shared/lib'

interface TooltipProps {
  content: string
  children: React.ReactNode
  position?: 'top' | 'bottom'
  className?: string
}

export function Tooltip({ content, children, position = 'bottom', className }: TooltipProps) {
  return (
    <span className={cn('group relative inline-flex items-center', className)}>
      {children}
      <span
        className={cn(
          'pointer-events-none absolute z-50 w-max max-w-[220px] rounded-lg border border-border bg-white px-3 py-2 text-[11px] leading-snug text-text-secondary shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100',
          position === 'top'
            ? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
            : 'top-full left-1/2 mt-2 -translate-x-1/2'
        )}
      >
        {content}
      </span>
    </span>
  )
}
