import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart3, Globe } from 'lucide-react'
import { useCompanyAuthStore } from '@/shared/model/companyAuthStore'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { useTranslation } from 'react-i18next'
import { LANGUAGES } from '@/shared/config/constants'
import { cn } from '@/shared/lib'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
})

type Form = z.infer<typeof schema>

export default function CompanyLoginPage() {
  const navigate = useNavigate()
  const login = useCompanyAuthStore((s) => s.login)
  const [serverError, setServerError] = useState('')
  const { i18n } = useTranslation()
  const [showLang, setShowLang] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: Form) => {
    try {
      setServerError('')
      const { data } = await apiClient.post('/company/auth/login', { ...values, actor: 'company' })
      const result = data as { access_token: string; refresh_token: string; user: Parameters<typeof login>[1] }
      login({ access_token: result.access_token, refresh_token: result.refresh_token }, result.user)
      navigate(ROUTES.COMPANY_DASHBOARD)
    } catch {
      setServerError('Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <Link to={ROUTES.PLATFORM_SELECT} className="flex items-center gap-2 text-indigo-300 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
        <div className="relative">
          <button
            onClick={() => setShowLang(!showLang)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white/70 text-sm hover:bg-white/20 transition-colors"
          >
            <Globe className="h-4 w-4" />
            {i18n.language.toUpperCase()}
          </button>
          {showLang && (
            <div className="absolute right-0 mt-1 w-36 rounded-lg border border-white/20 bg-indigo-900 shadow-xl py-1 z-50">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => { i18n.changeLanguage(lang.code); setShowLang(false) }}
                  className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/10 transition-colors',
                    i18n.language === lang.code ? 'text-indigo-300' : 'text-white/70')}
                >
                  <span>{lang.flag}</span>{lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500 mb-4 shadow-lg">
              <BarChart3 className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">iDap Business</h1>
            <p className="text-indigo-300 text-sm mt-1">Survey platform for companies</p>
          </div>

          {/* Form */}
          <div className="rounded-2xl bg-white/10 border border-white/20 backdrop-blur-sm p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-5">Sign in to your account</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-red-300">
                  {serverError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Email address</label>
                <input
                  type="email"
                  placeholder="company@example.com"
                  {...register('email')}
                  className="flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-200 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                />
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

          </div>

          <p className="text-center text-sm text-indigo-400 mt-4">
            Not a client yet?{' '}
            <a href="mailto:sales@idap.mn" className="text-indigo-200 hover:text-white">
              Contact sales →
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
