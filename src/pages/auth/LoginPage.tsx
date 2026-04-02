import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
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
  const { t: tc } = useTranslation('common')
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
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white mb-4">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{t('welcomeTitle')}</h1>
          <p className="mt-1 text-sm text-text-secondary">{t('welcomeSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600">{serverError}</div>
          )}

          <Input
            label={t('email')}
            type="email"
            placeholder="email@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label={t('password')}
            type="password"
            placeholder="********"
            error={errors.password?.message}
            {...register('password')}
          />

          <TurnstileMock onVerify={setTurnstileToken} />

          <Button type="submit" className="w-full" loading={isSubmitting} disabled={!turnstileToken}>
            {t('login')}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          {t('noAccount')}{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-primary-600 hover:underline">
            {t('register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
