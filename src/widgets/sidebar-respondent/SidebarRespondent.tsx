import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, Wallet, Bell, Settings, X, ClipboardList } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useAuthStore } from '@/shared/model/authStore'
import { ROUTES } from '@/shared/config/routes'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_ITEMS = [
  { to: ROUTES.FEED, icon: LayoutGrid, labelKey: 'nav:feed' },
  { to: ROUTES.SURVEY_HISTORY, icon: ClipboardList, labelKey: 'nav:surveyHistory' },
  { to: ROUTES.WALLET, icon: Wallet, labelKey: 'nav:wallet' },
  { to: ROUTES.NOTIFICATIONS, icon: Bell, labelKey: 'nav:notifications' },
  { to: ROUTES.SETTINGS, icon: Settings, labelKey: 'nav:settings' },
]

export function SidebarRespondent({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const profileScore = user?.profile_score ?? 0

  return (
    <>
      {/* Overlay (mobile) */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <span className="text-xl font-bold text-primary-600">iDap</span>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {t(item.labelKey)}
            </NavLink>
          ))}
        </nav>

        {/* Profile completion */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-text-secondary mb-2">{t('nav:profileCompletion')}</p>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-500 transition-all"
              style={{ width: `${profileScore}%` }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1">{profileScore}%</p>
        </div>
      </aside>
    </>
  )
}
