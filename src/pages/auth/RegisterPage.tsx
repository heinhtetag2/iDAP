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
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('registerTitle')}</h1>
        <p className="mt-1 text-sm text-white/50">{t('registerSubtitle')}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">{serverError}</div>
        )}

        <Input label={t('fullName')} placeholder="John Doe" error={errors.full_name?.message} dark {...register('full_name')} />
        <Input label={t('email')} type="email" placeholder="email@example.com" error={errors.email?.message} dark {...register('email')} />
        <Input label={t('password')} type="password" placeholder="••••••••" error={errors.password?.message} dark {...register('password')} />
        <Input label={t('confirmPassword')} type="password" placeholder="••••••••" error={errors.confirm_password?.message} dark {...register('confirm_password')} />

        <label className="flex items-start gap-2 text-sm text-white/50 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-sky-500 focus:ring-sky-500 focus:ring-offset-0"
            {...register('terms')}
          />
          <span>{t('termsAgree')}</span>
        </label>
        {errors.terms && (
          <p className="text-xs text-red-400">{errors.terms.message}</p>
        )}

        <TurnstileMock onVerify={setTurnstileToken} dark />

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border-0 shadow-lg shadow-sky-500/20"
          loading={isSubmitting}
          disabled={!turnstileToken}
        >
          {t('register')}
        </Button>
      </form>

      <p className="text-center text-sm text-white/40">
        {t('hasAccount')}{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-sky-400 hover:text-sky-300">
          {t('login')}
        </Link>
      </p>
    </div>
  )
}
