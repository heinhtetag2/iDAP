import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import { LANGUAGES } from '@/shared/config/constants'

export function AuthLayout() {
  const { i18n } = useTranslation()
  const [showLang, setShowLang] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex flex-col">
      {/* Language switcher */}
      <div className="flex justify-end p-4">
        <div className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-border text-sm hover:bg-white"
          >
            <Globe className="h-4 w-4" />
            {i18n.language.toUpperCase()}
          </button>
          {showLang && (
            <div className="absolute right-0 mt-1 w-40 rounded-lg border border-border bg-white shadow-lg py-1 z-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setShowLang(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    i18n.language === lang.code ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-600">iDap</h1>
          </div>
          <div className="rounded-2xl bg-white border border-border shadow-sm p-6 sm:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
