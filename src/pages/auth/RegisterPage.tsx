import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, ArrowLeft } from 'lucide-react'
import { Button, Input, TurnstileMock } from '@/shared/ui'
import { useAuthStore } from '@/shared/model/authStore'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'

const registerSchema = z
  .object({
    full_name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    confirm_password: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: 'Required' }) }),
  })
  .refine((d) => d.password === d.confirm_password, {
    path: ['confirm_password'],
    message: 'Passwords do not match',
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [serverError, setServerError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (values: RegisterForm) => {
    try {
      setServerError('')
      const { data } = await apiClient.post('/auth/register/respondent', {
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      })
      const result = data as {
        access_token: string
        refresh_token: string
        user: Parameters<typeof login>[1]
      }
      login(
        { access_token: result.access_token, refresh_token: result.refresh_token },
        result.user,
      )
      navigate(ROUTES.PROFILE_SETUP)
    } catch (err: unknown) {
      const error = err as { message?: string }
      setServerError(error.message ?? 'Registration failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Link
        to="/"
        className="fixed top-5 left-5 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white mb-4">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">{t('registerTitle')}</h1>
          <p className="mt-1 text-sm text-text-secondary">{t('registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-600">{serverError}</div>
          )}

          <Input
            label={t('fullName')}
            placeholder="John Doe"
            error={errors.full_name?.message}
            {...register('full_name')}
          />

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

          <Input
            label={t('confirmPassword')}
            type="password"
            placeholder="********"
            error={errors.confirm_password?.message}
            {...register('confirm_password')}
          />

          <label className="flex items-start gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500"
              {...register('terms')}
            />
            <span>{t('termsAgree')}</span>
          </label>
          {errors.terms && (
            <p className="text-xs text-danger-500">{errors.terms.message}</p>
          )}

          <TurnstileMock onVerify={setTurnstileToken} />

          <Button type="submit" className="w-full" loading={isSubmitting} disabled={!turnstileToken}>
            {t('register')}
          </Button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          {t('hasAccount')}{' '}
          <Link to={ROUTES.LOGIN} className="font-medium text-primary-600 hover:underline">
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
