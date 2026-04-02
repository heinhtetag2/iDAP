import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Bell, Menu, Globe, LogOut, User, LayoutGrid } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/model/authStore'
import { ROUTES } from '@/shared/config/routes'
import { LANGUAGES } from '@/shared/config/constants'
import { apiClient } from '@/shared/api/client'

function useUnreadNotifCount() {
  const { data } = useQuery<{ id: string; is_read: boolean }[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications')
      return data as { id: string; is_read: boolean }[]
    },
    staleTime: 60 * 1000,
  })
  return data?.filter((n) => !n.is_read).length ?? 0
}

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuthStore()
  const unreadCount = useUnreadNotifCount()
  const [showLang, setShowLang] = useState(false)
  const [showUser, setShowUser] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUser(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-bold text-primary-600 lg:hidden">iDap</span>
        <Link to="/" className="hidden lg:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-gray-50 border border-transparent hover:border-border transition-all">
          <LayoutGrid className="h-3.5 w-3.5" />
          Switch portal
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Link
          to={ROUTES.NOTIFICATIONS}
          className="relative p-2 rounded-lg hover:bg-gray-100 text-text-secondary"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Language switcher */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-gray-100 text-text-secondary text-sm"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
          </button>
          {showLang && (
            <div className="absolute right-0 mt-1 w-40 rounded-lg border border-border bg-surface shadow-lg py-1 z-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    i18n.changeLanguage(lang.code)
                    setShowLang(false)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    i18n.language === lang.code ? 'text-primary-600 font-medium' : 'text-text-primary'
                  }`}
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => setShowUser(!showUser)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100"
          >
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-medium text-primary-700">
              {user?.full_name?.charAt(0) ?? 'U'}
            </div>
          </button>
          {showUser && (
            <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-surface shadow-lg py-1 z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
              <Link
                to={ROUTES.SETTINGS}
                onClick={() => setShowUser(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                {t('nav:profile')}
              </Link>
              <button
                onClick={() => {
                  logout()
                  setShowUser(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                {t('auth:logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
