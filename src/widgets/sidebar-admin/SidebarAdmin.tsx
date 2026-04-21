import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, Users, FileText, Banknote, AlertTriangle, X, Shield, Bell, Settings } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { useAdminAuthStore } from '@/shared/model/adminAuthStore'
import { ROUTES } from '@/shared/config/routes'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Users',
    items: [
      { to: ROUTES.ADMIN_COMPANIES, icon: Building2, label: 'Companies' },
      { to: ROUTES.ADMIN_RESPONDENTS, icon: Users, label: 'Respondents' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: ROUTES.ADMIN_SURVEYS, icon: FileText, label: 'Surveys' },
    ],
  },
  {
    label: 'Payments',
    items: [
      { to: ROUTES.ADMIN_PAYOUTS, icon: Banknote, label: 'Payouts' },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { to: ROUTES.ADMIN_FRAUD, icon: AlertTriangle, label: 'Fraud Queue' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: ROUTES.ADMIN_NOTIFICATIONS, icon: Bell, label: 'Notifications' },
      { to: ROUTES.ADMIN_SETTINGS, icon: Settings, label: 'Settings' },
    ],
  },
]

const BADGES: Record<string, { count: number; color: string }> = {
  [ROUTES.ADMIN_FRAUD]: { count: 3, color: 'bg-red-500' },
}

export function SidebarAdmin({ isOpen, onClose }: SidebarProps) {
  const user = useAdminAuthStore((s) => s.user)

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full w-64 flex-col bg-violet-950 transition-transform lg:translate-x-0 lg:static lg:z-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-violet-800">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-violet-500 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-sm">iDap</span>
              <span className="text-violet-400 text-xs ml-1">Admin</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-violet-800">
            <X className="h-5 w-5 text-violet-300" />
          </button>
        </div>

        {/* Admin info */}
        {user && (
          <div className="px-4 py-3 border-b border-violet-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-700 text-sm font-bold text-white">
                {user.full_name?.charAt(0) ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                <span className="text-xs text-violet-400 capitalize">
                  {user.admin_role?.replace('_', ' ') ?? 'admin'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-3 space-y-4 overflow-y-auto">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-violet-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const badge = BADGES[item.to]
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === ROUTES.ADMIN_DASHBOARD}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-violet-800 text-white'
                            : 'text-violet-300 hover:bg-violet-900 hover:text-white'
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {item.label}
                      {badge && (
                        <span className={cn('ml-auto flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white', badge.color)}>
                          {badge.count}
                        </span>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Platform status */}
        <div className="p-4 border-t border-violet-800">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-xs text-violet-400">All systems operational</p>
          </div>
        </div>
      </aside>
    </>
  )
}
