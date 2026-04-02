import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button, Input, Spinner } from '@/shared/ui'
import { cn } from '@/shared/lib'
import { useUpdateProfile, useProfile } from '@/entities/user'
import { PROVINCES, getDistrictsByProvince } from '@/shared/config/mongoliaGeo'
import { ROUTES } from '@/shared/config/routes'

const STEPS = ['personal', 'location', 'background', 'interests'] as const

const INTERESTS = [
  'technology', 'sports', 'finance', 'music', 'travel', 'food',
  'fashion', 'education', 'health', 'business', 'art', 'gaming',
] as const

const EDUCATION_LEVELS = ['primary', 'secondary', 'vocational', 'bachelor', 'master', 'phd', 'other'] as const
const INCOME_RANGES = ['under_500k', '500k_1m', '1m_3m', '3m_5m', 'over_5m'] as const
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'other'] as const

export default function ProfileSetupPage() {
  const { t: tc } = useTranslation('common')
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    birth_date: '',
    gender: '' as string,
    marital_status: '' as string,
    province: '' as string,
    district: '' as string,
    occupation: '',
    education_level: '' as string,
    income_range: '' as string,
    interests: [] as string[],
  })

  useMemo(() => {
    if (profile) {
      setForm({
        birth_date: profile.birth_date ?? '',
        gender: profile.gender ?? '',
        marital_status: profile.marital_status ?? '',
        province: profile.province ?? '',
        district: profile.district ?? '',
        occupation: profile.occupation ?? '',
        education_level: profile.education_level ?? '',
        income_range: profile.income_range ?? '',
        interests: profile.interests ?? [],
      })
    }
  }, [profile])

  const districts = useMemo(
    () => (form.province ? getDistrictsByProvince(form.province) : []),
    [form.province],
  )

  const lang = i18n.language as 'mn' | 'en' | 'ko'

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const toggleInterest = (interest: string) =>
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (form.interests.length < 3) return
    await updateProfile.mutateAsync(form)
    navigate(ROUTES.FEED)
  }

  const stepLabels = [
    tc('profile.stepPersonal'),
    tc('profile.stepLocation'),
    tc('profile.stepBackground'),
    tc('profile.stepInterests'),
  ]

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg space-y-8">
        {/* Stepper */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  i < step
                    ? 'bg-success-600 text-white'
                    : i === step
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-text-muted',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-0.5 w-8 sm:w-12', i < step ? 'bg-success-600' : 'bg-gray-200')} />
              )}
            </div>
          ))}
        </div>

        {/* Step title */}
        <h2 className="text-xl font-semibold text-text-primary text-center">{stepLabels[step]}</h2>

        {/* Step 1: Personal */}
        {step === 0 && (
          <div className="space-y-4">
            <Input
              label={tc('profile.dateOfBirth')}
              type="date"
              value={form.birth_date}
              onChange={(e) => update('birth_date', e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{tc('profile.gender')}</label>
              <div className="flex gap-4">
                {(['male', 'female', 'other'] as const).map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={() => update('gender', g)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="capitalize">{g}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{tc('profile.maritalStatus')}</label>
              <select
                value={form.marital_status}
                onChange={(e) => update('marital_status', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="">Select...</option>
                {MARITAL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Location */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{tc('profile.province')}</label>
              <select
                value={form.province}
                onChange={(e) => { update('province', e.target.value); update('district', '') }}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="">{tc('profile.selectProvince')}</option>
                {PROVINCES.map((p) => (
                  <option key={p.code} value={p.code}>
                    {lang === 'mn' ? p.name_mn : p.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{tc('profile.district')}</label>
              <select
                value={form.district}
                onChange={(e) => update('district', e.target.value)}
                disabled={!form.province}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="">{tc('profile.selectDistrict')}</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {lang === 'mn' ? d.name_mn : d.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 3: Background */}
        {step === 2 && (
          <div className="space-y-4">
            <Input
              label={tc('profile.occupation')}
              value={form.occupation}
              onChange={(e) => update('occupation', e.target.value)}
              placeholder="e.g. Software Engineer"
            />

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{tc('profile.educationLevel')}</label>
              <select
                value={form.education_level}
                onChange={(e) => update('education_level', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="">Select...</option>
                {EDUCATION_LEVELS.map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1).replace('_', ' ')}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">{tc('profile.incomeRange')}</label>
              <select
                value={form.income_range}
                onChange={(e) => update('income_range', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <option value="">Select...</option>
                {INCOME_RANGES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ').replace('under ', '< ').replace('over ', '> ')}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">{tc('profile.interestsHint')}</p>
            {form.interests.length < 3 && (
              <p className="text-xs text-warning-600">{tc('profile.minInterests')}</p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors capitalize',
                    form.interests.includes(interest)
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-secondary',
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack} disabled={step === 0}>
            {tc('back')}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>{tc('next')}</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              loading={updateProfile.isPending}
              disabled={form.interests.length < 3}
            >
              {tc('submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
