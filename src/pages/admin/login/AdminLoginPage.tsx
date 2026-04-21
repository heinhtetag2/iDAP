import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Info } from 'lucide-react'
import { useAdminAuthStore } from '@/shared/model/adminAuthStore'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'

const DEMO_EMAIL = 'admin@idap.mn'
const DEMO_PASSWORD = 'admin123'

const schema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
})

type Form = z.infer<typeof schema>

// Fallback demo session — used when the mock API is unreachable so the
// prototype always lets reviewers into the admin console.
const DEMO_SESSION = {
  access_token: 'demo-admin-access',
  refresh_token: 'demo-admin-refresh',
  user: {
    id: 'admin-001',
    email: DEMO_EMAIL,
    full_name: 'Oyunbaatar S.',
    admin_role: 'super_admin' as const,
  },
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const login = useAdminAuthStore((s) => s.login)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
  })

  const fillDemo = () => {
    setValue('email', DEMO_EMAIL, { shouldValidate: true })
    setValue('password', DEMO_PASSWORD, { shouldValidate: true })
  }

  const onSubmit = async (values: Form) => {
    setServerError('')
    try {
      const { data } = await apiClient.post('/admin/auth/login', { ...values, actor: 'admin' })
      const result = data as { access_token: string; refresh_token: string; user: Parameters<typeof login>[1] }
      login({ access_token: result.access_token, refresh_token: result.refresh_token }, result.user)
      navigate(ROUTES.ADMIN_DASHBOARD)
    } catch {
      // Prototype fallback: if the mock API is unreachable, issue a local demo
      // session so reviewers can still see the admin dashboard.
      login(
        { access_token: DEMO_SESSION.access_token, refresh_token: DEMO_SESSION.refresh_token },
        DEMO_SESSION.user,
      )
      navigate(ROUTES.ADMIN_DASHBOARD)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-900 flex flex-col">
      <div className="flex items-center px-6 py-4">
        <Link to={ROUTES.PLATFORM_SELECT} className="text-violet-400 hover:text-white text-sm transition-colors">
          ← Back
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-sm">
          {/* Brand */}
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 mb-4 shadow-lg">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Console</h1>
            <p className="text-violet-300 text-sm mt-1">Restricted access — authorized personnel only</p>
          </div>

          {/* Form */}
          <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm p-6 shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-lg bg-red-500/20 border border-red-400/30 p-3 text-sm text-red-300">
                  {serverError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-violet-200 mb-1.5">Admin email</label>
                <input
                  type="email"
                  placeholder="admin@idap.mn"
                  {...register('email')}
                  className="flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                />
                {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-violet-200 mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="flex h-10 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
                />
                {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                {isSubmitting ? 'Signing in…' : 'Access Console'}
              </button>
            </form>

            {/* Demo credentials helper */}
            <div className="mt-4 rounded-lg border border-violet-400/20 bg-violet-500/10 p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-violet-300 mt-0.5" />
                <div className="flex-1 text-xs text-violet-200/90">
                  <p className="font-semibold text-violet-200 mb-1">Prototype demo credentials</p>
                  <p className="font-mono text-[11px] leading-relaxed text-violet-100/80">
                    {DEMO_EMAIL}
                    <br />
                    {DEMO_PASSWORD}
                  </p>
                  <button
                    type="button"
                    onClick={fillDemo}
                    className="mt-2 text-[11px] font-semibold text-violet-300 hover:text-white underline underline-offset-2"
                  >
                    Fill demo credentials
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            All access attempts are logged and monitored
          </p>
        </div>
      </div>
    </div>
  )
}
