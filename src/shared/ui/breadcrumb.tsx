import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib'

export interface BreadcrumbItem {
  label: string
  href?: string
  state?: Record<string, unknown>
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1 text-sm mb-4', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-text-muted shrink-0" />}
            {isLast || !item.href ? (
              <span className={cn(isLast ? 'font-medium text-text-primary truncate max-w-[200px]' : 'text-text-muted')}>
                {item.label}
              </span>
            ) : (
              <Link
                to={item.href}
                state={item.state}
                className="text-text-muted hover:text-violet-600 transition-colors truncate max-w-[160px]"
              >
                {item.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
