import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInfiniteQuery } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, CardContent, Skeleton, EmptyState, Spinner, Badge } from '@/shared/ui'
import { cn, formatCurrency, formatDate } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'

interface SurveyHistoryItem {
  id: string
  survey_id: string
  survey_title: string
  status: 'completed' | 'pending_review' | 'invalidated'
  reward_amount: number
  reward_status: 'granted' | 'pending' | 'invalidated'
  completed_at: string
}

const STATUS_FILTERS = ['all', 'completed', 'pending_review', 'invalidated'] as const

async function fetchSurveyHistory(params: { cursor?: string; limit?: number; status?: string }) {
  const { data, meta } = await apiClient.get('/respondent/surveys/history', { params })
  return {
    items: data as SurveyHistoryItem[],
    cursor: meta?.cursor ?? undefined,
    has_next: meta?.has_next ?? false,
  }
}

function useHistoryQuery(status: string) {
  return useInfiniteQuery({
    queryKey: ['survey-history', status],
    queryFn: ({ pageParam }) =>
      fetchSurveyHistory({ cursor: pageParam as string | undefined, limit: 20, status: status === 'all' ? undefined : status }),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.cursor : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: 2 * 60 * 1000,
  })
}

export default function SurveyHistoryPage() {
  const { t } = useTranslation('survey')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useHistoryQuery(statusFilter)

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  })

  const items: SurveyHistoryItem[] = data?.pages.flatMap((p) => p.items) ?? []

  const statusConfig = {
    completed: { icon: CheckCircle, color: 'text-success-600', bg: 'bg-success-100', variant: 'success' as const },
    pending_review: { icon: Clock, color: 'text-warning-600', bg: 'bg-warning-100', variant: 'warning' as const },
    invalidated: { icon: XCircle, color: 'text-danger-600', bg: 'bg-danger-100', variant: 'danger' as const },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-text-primary">{t('history')}</h1>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(s)}
          >
            {t(`historyFilters.${s}`)}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-48 mb-1.5" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && items.length === 0 && (
        <EmptyState title={t('historyEmpty')} description={tc('noResults')} />
      )}

      {/* List */}
      {!isLoading && items.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="divide-y divide-border">
              {items.map((item) => {
                const cfg = statusConfig[item.status]
                const Icon = cfg.icon
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', cfg.bg, cfg.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{item.survey_title}</p>
                      <p className="text-xs text-text-muted">{formatDate(item.completed_at)}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      {item.reward_amount > 0 ? (
                        <p className={cn('text-sm font-semibold', item.reward_status === 'granted' ? 'text-success-600' : item.reward_status === 'pending' ? 'text-warning-600' : 'text-text-muted')}>
                          +{formatCurrency(item.reward_amount)}
                        </p>
                      ) : (
                        <p className="text-sm text-text-muted">—</p>
                      )}
                      <Badge variant={cfg.variant} className="text-xs">
                        {t(`historyStatus.${item.status}`)}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && <Spinner className="h-6 w-6" />}
      </div>
    </div>
  )
}
