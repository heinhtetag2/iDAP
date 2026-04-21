import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ArrowUpRight } from 'lucide-react'
import { cn } from '@/shared/lib'

interface SlidePanelProps {
  isOpen: boolean
  onClose: () => void
  fullPageHref?: string
  fullPageState?: Record<string, unknown>
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
  width?: string
}

export function SlidePanel({
  isOpen,
  onClose,
  fullPageHref,
  fullPageState,
  title,
  subtitle,
  children,
  width = 'w-[480px]',
}: SlidePanelProps) {
  const navigate = useNavigate()

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/20 transition-opacity duration-200',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full bg-white shadow-2xl flex flex-col transition-transform duration-250 ease-in-out',
          width,
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-text-primary truncate">{title}</h2>
            {subtitle && <div className="mt-0.5">{subtitle}</div>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {fullPageHref && (
              <button
                onClick={() => { onClose(); navigate(fullPageHref, { state: fullPageState }) }}
                className="flex items-center gap-1.5 rounded-lg border border-border hover:bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-text-secondary transition-colors"
              >
                Open full page <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-text-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
}
