import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Clock, Users, Lock } from 'lucide-react'
import { Card, CardContent, Badge, Skeleton, EmptyState, Spinner } from '@/shared/ui'
import { cn, formatCurrency } from '@/shared/lib'
import { useSurveyFeed } from '@/entities/survey'
import type { SurveyFeedItem } from '@/entities/survey'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'
import { ROUTES } from '@/shared/config/routes'
import { SURVEY_CATEGORIES } from '@/shared/config/constants'
import { useAuthStore } from '@/shared/model/authStore'

export default function SurveyFeedPage() {
  const { t } = useTranslation('survey')
  const navigate = useNavigate()
  const userTrustLevel = useAuthStore((s) => s.user?.trust_level ?? 1)

  const [category, setCategory] = useState<string>('')
  const [sort, setSort] = useState<string>('recommended')

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSurveyFeed({
    category: category || undefined,
    sort,
  })

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  })

  const surveys: SurveyFeedItem[] = data?.pages.flatMap((p) => p.items) ?? []

  const getMatchBadge = (score: number) => {
    if (score >= 80) return { variant: 'success' as const, label: `${score}%` }
    if (score >= 50) return { variant: 'warning' as const, label: `${score}%` }
    return { variant: 'secondary' as const, label: `${score}%` }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('feed')}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          <option value="">{t('category')} - All</option>
          {SURVEY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t(`categories.${cat}`)}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          {['recommended', 'reward_high', 'deadline', 'short'].map((s) => (
            <option key={s} value={s}>
              {t(`sortOptions.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-8 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && surveys.length === 0 && (
        <EmptyState
          title={t('feedEmpty')}
          description={t('feedEmptyAction')}
        />
      )}

      {/* Survey grid */}
      {!isLoading && surveys.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((survey) => {
            const match = getMatchBadge(survey.match_score)
            const spotsPercent = Math.round(
              ((survey.max_responses - survey.remaining_spots) / survey.max_responses) * 100,
            )
            const isLocked = (survey.trust_level_required ?? 1) > userTrustLevel

            return (
              <Card
                key={survey.id}
                className={cn(
                  'transition-shadow relative overflow-hidden',
                  isLocked ? 'cursor-default opacity-75' : 'cursor-pointer hover:shadow-md',
                )}
                onClick={() => !isLocked && navigate(ROUTES.SURVEY_DETAIL(survey.id))}
              >
                {/* Lock overlay */}
                {isLocked && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-[2px] gap-2 px-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100">
                      <Lock className="h-5 w-5 text-warning-600" />
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {t('trustLevelRequired', { level: survey.trust_level_required })}
                    </p>
                    <p className="text-xs text-text-muted">
                      {t('trustLevelHint')}
                    </p>
                  </div>
                )}

                <CardContent className="p-4 space-y-3">
                  {/* Company + match score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={survey.company.logo_url}
                        alt={survey.company.name}
                        className="h-6 w-6 rounded-full"
                      />
                      <span className="text-xs text-text-secondary truncate max-w-[120px]">
                        {survey.company.name}
                      </span>
                    </div>
                    <Badge variant={match.variant}>{match.label}</Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
                    {survey.title}
                  </h3>

                  {/* Reward + time */}
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span className="font-semibold text-primary-600 text-sm">
                      {formatCurrency(survey.reward_amount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {survey.estimated_minutes} min
                    </span>
                  </div>

                  {/* Remaining spots progress */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-text-muted mb-1">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t('remainingSpots')}
                      </span>
                      <span>{survey.remaining_spots}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-200">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          spotsPercent > 80 ? 'bg-danger-500' : spotsPercent > 50 ? 'bg-warning-500' : 'bg-success-500',
                        )}
                        style={{ width: `${spotsPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Category badge */}
                  <Badge variant="outline" className="text-xs">
                    {t(`categories.${survey.category}`)}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Spinner className="h-6 w-6" />}
      </div>
    </div>
  )
}
