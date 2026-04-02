import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { CheckCircle, Clock, XCircle } from 'lucide-react'
import { Button, Card, CardContent } from '@/shared/ui'
import { cn, formatCurrency } from '@/shared/lib'
import { ROUTES } from '@/shared/config/routes'
import type { SubmitResult } from '@/entities/survey'

export default function SurveyCompletePage() {
  const { t } = useTranslation('survey')
  const navigate = useNavigate()
  const location = useLocation()
  const result = (location.state as { result?: SubmitResult })?.result

  const [displayAmount, setDisplayAmount] = useState(0)
  const animationRef = useRef<number>(0)

  const rewardAmount = result?.reward.amount ?? 0
  const rewardStatus = result?.reward.status ?? 'pending'

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

        {/* Reward card */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-text-muted">{t('earned')}</p>
            <p className="text-4xl font-bold text-primary-600">
              {formatCurrency(displayAmount)}
            </p>
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
