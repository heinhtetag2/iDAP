import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Button, Card, CardContent, Skeleton, EmptyState, Spinner } from '@/shared/ui'
import { cn, formatCurrency, formatDate } from '@/shared/lib'
import { useTransactions } from '@/entities/wallet'
import type { Transaction } from '@/entities/wallet'
import { useInfiniteScroll } from '@/shared/hooks/useInfiniteScroll'

const FILTERS = ['all', 'earned', 'pending', 'released', 'withdrawn', 'refunded', 'deducted'] as const

export default function WalletHistoryPage() {
  const { t } = useTranslation('wallet')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()

  const [typeFilter, setTypeFilter] = useState<string>('all')

  const {
    data,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useTransactions(typeFilter === 'all' ? undefined : typeFilter)

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    fetchNextPage,
  })

  const transactions: Transaction[] =
    data?.pages.flatMap((p) => p.items) ?? []

  const getTxIcon = (type: string) => {
    if (type === 'withdrawn' || type === 'deducted') return ArrowDownRight
    return ArrowUpRight
  }
  const getTxColor = (type: string) => {
    if (type === 'withdrawn' || type === 'deducted') return 'text-danger-600'
    if (type === 'pending') return 'text-warning-600'
    return 'text-success-600'
  }
  const getTxSign = (type: string) => {
    if (type === 'withdrawn' || type === 'deducted') return '-'
    return '+'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-text-primary">{t('transactions')}</h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant={typeFilter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(f)}
          >
            {t(`transactionTypes.${f}`)}
          </Button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-40 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="text-right">
                  <Skeleton className="h-4 w-20 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && transactions.length === 0 && (
        <EmptyState title={t('noTransactions')} />
      )}

      {/* Transaction list */}
      {!isLoading && transactions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const Icon = getTxIcon(tx.type)
                const color = getTxColor(tx.type)
                const sign = getTxSign(tx.type)
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100', color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{tx.note}</p>
                      <p className="text-xs text-text-muted">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn('text-sm font-semibold', color)}>
                        {sign}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {formatCurrency(tx.balance_after)}
                      </p>
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
