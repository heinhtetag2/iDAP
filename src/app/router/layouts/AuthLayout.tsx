import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { useState } from 'react'
import { LANGUAGES } from '@/shared/config/constants'

export function AuthLayout() {
  const { i18n } = useTranslation()
  const [showLang, setShowLang] = useState(false)

  return (
    <div className="min-h-screen bg-[#06080f] flex flex-col overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-sky-700/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-blue-600/15 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-sky-900/20 blur-[80px]" />
      </div>

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-sky-500/25">
            i
          </div>
          <span className="text-white font-bold text-sm">iDap</span>
          <span className="text-sky-400 text-xs ml-0.5">Respondent</span>
        </div>

        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Globe className="h-4 w-4" />
            {i18n.language.toUpperCase()}
          </button>
          {showLang && (
            <div className="absolute right-0 mt-1 w-40 rounded-xl border border-white/10 bg-[#0d1117] shadow-xl py-1 z-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setShowLang(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                    i18n.language === lang.code ? 'text-sky-400 font-medium' : 'text-white/60'
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
      <div className="relative flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
