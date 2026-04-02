import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn, ArrowLeft } from 'lucide-react'
import { Button, Input, TurnstileMock } from '@/shared/ui'
import { useAuthStore } from '@/shared/model/authStore'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [serverError, setServerError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginForm) => {
    try {
      setServerError('')
      const { data } = await apiClient.post('/auth/login', { ...values, actor: 'respondent' })
      const result = data as {
        access_token: string
        refresh_token: string
        user: Parameters<typeof login>[1]
      }
      login(
        { access_token: result.access_token, refresh_token: result.refresh_token },
        result.user,
      )
      navigate(ROUTES.FEED)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setServerError(error.message ?? t('invalidCredentials'))
    }
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white mb-4 shadow-lg shadow-sky-500/25">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('welcomeTitle')}</h1>
        <p className="mt-1 text-sm text-white/50">{t('welcomeSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{serverError}</div>
        )}

        <Input
          label={t('email')}
          type="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          dark
          {...register('email')}
        />

        <Input
          label={t('password')}
          type="password"
          placeholder="********"
          error={errors.password?.message}
          dark
          {...register('password')}
        />

        <TurnstileMock onVerify={setTurnstileToken} dark />

        <Button type="submit" className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border-0 shadow-lg shadow-sky-500/20" loading={isSubmitting} disabled={!turnstileToken}>
          {t('login')}
        </Button>
      </form>

      {/* Demo hint */}
      <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
        <p className="text-xs font-medium text-white/50 mb-1">Demo credentials</p>
        <p className="text-xs text-white/40">any email / any password (min 6 chars)</p>
      </div>

      <p className="text-center text-sm text-white/40">
        {t('noAccount')}{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-sky-400 hover:text-sky-300">
          {t('register')}
        </Link>
      </p>
    </div>
  )
}
