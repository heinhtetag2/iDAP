import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle, Clock, XCircle, TrendingUp, Star, Info } from 'lucide-react'
import { Button, Card, CardContent } from '@/shared/ui'
import { cn, formatCurrency } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'
import type { SubmitResult } from '@/entities/survey'
import { useQueryClient } from '@tanstack/react-query'

const TRUST_LABELS = ['', 'New', 'Verified', 'Trusted', 'Premium', 'Partner']

export default function SurveyCompletePage() {
  const { t } = useTranslation('survey')
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const result = (location.state as { result?: SubmitResult })?.result

  const [displayAmount, setDisplayAmount] = useState(0)
  const animationRef = useRef<number>(0)

  const rewardAmount = result?.reward.amount ?? 0
  const rewardStatus = result?.reward.status ?? 'pending'

  // Invalidate trust status so feed card refreshes
  useEffect(() => {
    if (result) {
      queryClient.invalidateQueries({ queryKey: ['respondent', 'trust-status'] })
    }
  }, [result, queryClient])

  // Count-up animation
  useEffect(() => {
    if (rewardAmount <= 0) return

    const duration = 1500
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayAmount(Math.round(eased * rewardAmount))

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [rewardAmount])

  const statusConfig = {
    granted: {
      icon: CheckCircle,
      color: 'text-success-600',
      bg: 'bg-success-50',
      message: t('rewardInstant'),
    },
    pending: {
      icon: Clock,
      color: 'text-warning-600',
      bg: 'bg-warning-50',
      message: t('rewardHeld'),
    },
    invalidated: {
      icon: XCircle,
      color: 'text-danger-600',
      bg: 'bg-danger-50',
      message: t('rewardInvalid'),
    },
  }

  const config = statusConfig[rewardStatus]
  const StatusIcon = config.icon

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Icon */}
        <div className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full', config.bg)}>
          <StatusIcon className={cn('h-10 w-10', config.color)} />
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('completeTitle')}</h1>
          <p className="mt-1 text-sm text-text-secondary">{t('completeSubtitle')}</p>
        </div>

        {/* Level upgrade banner */}
        {result?.level_upgraded && (
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-left">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Trust Level Upgraded!</p>
              <p className="text-xs text-amber-700">
                You are now Level {result.new_trust_level} — {TRUST_LABELS[result.new_trust_level]}!
                New surveys unlocked.
              </p>
            </div>
          </div>
        )}

        {/* Reward card */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-text-muted">{t('earned')}</p>
            <p className="text-4xl font-bold text-primary-600">
              {formatCurrency(displayAmount)}
            </p>

            {/* Quality score + multiplier */}
            {result && result.reward.base_amount > 0 && (
              <>
                {/* Score tier */}
                <div className="flex items-center justify-center gap-2">
                  {(() => {
                    const score = result.quality_score
                    const tier = score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Low'
                    const tierColor = score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
                    return (
                      <>
                        <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={cn('h-full rounded-full', score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                            style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-text-primary">{score}%</span>
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', tierColor)}>{tier} Quality</span>
                      </>
                    )
                  })()}
                </div>

                {/* Multiplier line */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>
                    Base {formatCurrency(result.reward.base_amount)} ×
                    <span className={cn('font-semibold ml-0.5', result.quality_multiplier > 1 ? 'text-green-600' : result.quality_multiplier < 1 ? 'text-warning-600' : 'text-text-muted')}>
                      {result.quality_multiplier}
                    </span>
                    {' '}quality multiplier
                  </span>
                </div>

                {/* How quality is scored */}
                <div className="mt-1 rounded-lg bg-gray-50 border border-border p-3 text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Info className="h-3.5 w-3.5 text-text-muted" />
                    <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">How quality is scored</span>
                  </div>
                  {[
                    { label: 'Time per question', note: 'Reading speed — too fast signals skipping' },
                    { label: 'Answer variety', note: 'Diverse choices vs. repetitive patterns' },
                    { label: 'Completion rate', note: 'All required questions answered' },
                    { label: 'Consistency', note: 'Answers align logically across questions' },
                  ].map((f) => (
                    <div key={f.label} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-text-muted mt-1.5 shrink-0" />
                      <div>
                        <span className="text-[11px] font-medium text-text-primary">{f.label}</span>
                        <span className="text-[11px] text-text-muted"> — {f.note}</span>
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="text-[11px] text-text-muted">
                      Multiplier range: <span className="text-red-500 font-medium">×0.5</span> (low) →
                      <span className="text-text-muted font-medium"> ×1.0</span> (standard) →
                      <span className="text-green-600 font-medium"> ×1.2</span> (high)
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', config.bg, config.color)}>
              <StatusIcon className="h-3.5 w-3.5" />
              {config.message}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={() => navigate(ROUTES.FEED)}>
            {t('backToFeed')}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate(ROUTES.WALLET)}>
            {t('goToWallet')}
          </Button>
        </div>
      </div>
    </div>
  )
}
