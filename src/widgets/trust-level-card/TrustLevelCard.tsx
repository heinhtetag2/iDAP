import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { Shield, TrendingUp, Star, ChevronRight, AlertTriangle } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Skeleton } from '@/shared/ui'

interface TrustStatus {
  trust_level: number
  trust_label: string
  responses_count: number
  avg_quality_score: number
  warning_count: number
  next_level: number | null
  next_level_label: string | null
  next_threshold: {
    min_responses: number
    min_quality: number
    label: string
    color: string
  } | null
}

const LEVEL_CONFIG: Record<number, { bg: string; border: string; badge: string; text: string; icon: string }> = {
  1: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-700', text: 'text-gray-700', icon: '🌱' },
  2: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', text: 'text-blue-700', icon: '✅' },
  3: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', text: 'text-green-700', icon: '⭐' },
  4: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', text: 'text-violet-700', icon: '💎' },
  5: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700', icon: '👑' },
}

const LEVEL_PERKS: Record<number, string[]> = {
  1: ['Basic surveys only', 'Standard reward rate'],
  2: ['All L1 perks', 'Access to verified surveys', '×0.9–×1.2 quality multiplier'],
  3: ['All L2 perks', 'Trusted-tier surveys unlocked', 'Priority survey matching'],
  4: ['All L3 perks', 'Premium surveys', 'Faster reward release'],
  5: ['All L4 perks', 'VIP-only surveys', 'Max quality multiplier ×1.2', 'Dedicated support'],
}

function getQualityMultiplier(avgQuality: number): { label: string; color: string } {
  if (avgQuality >= 90) return { label: '×1.2', color: 'text-green-600' }
  if (avgQuality >= 85) return { label: '×1.1', color: 'text-green-500' }
  if (avgQuality >= 80) return { label: '×1.0', color: 'text-blue-600' }
  if (avgQuality >= 75) return { label: '×0.9', color: 'text-warning-600' }
  return { label: '×0.8', color: 'text-danger-600' }
}

export function TrustLevelCard() {
  const { data, isLoading } = useQuery<TrustStatus>({
    queryKey: ['respondent', 'trust-status'],
    queryFn: async () => {
      const { data } = await apiClient.get('/respondent/trust-status')
      return data as TrustStatus
    },
    staleTime: 60000,
  })

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    )
  }

  if (!data) return null

  const cfg = LEVEL_CONFIG[data.trust_level] ?? LEVEL_CONFIG[1]
  const perks = LEVEL_PERKS[data.trust_level] ?? []
  const qMultiplier = getQualityMultiplier(data.avg_quality_score)
  const isMaxLevel = data.trust_level >= 5

  // Progress toward next level
  const responsesProgress = !isMaxLevel && data.next_threshold
    ? Math.min((data.responses_count / data.next_threshold.min_responses) * 100, 100)
    : 100
  const qualityProgress = !isMaxLevel && data.next_threshold
    ? Math.min((data.avg_quality_score / data.next_threshold.min_quality) * 100, 100)
    : 100
  const responsesNeeded = !isMaxLevel && data.next_threshold
    ? Math.max(data.next_threshold.min_responses - data.responses_count, 0)
    : 0
  const qualityNeeded = !isMaxLevel && data.next_threshold
    ? Math.max(data.next_threshold.min_quality - data.avg_quality_score, 0)
    : 0

  return (
    <div className={cn('rounded-xl border p-4 space-y-4', cfg.bg, cfg.border)}>
      {/* Header: level badge + multiplier + warnings */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full text-xl', cfg.badge)}>
            {cfg.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('text-sm font-bold', cfg.text)}>
                Level {data.trust_level} — {data.trust_label}
              </span>
              <Shield className={cn('h-3.5 w-3.5', cfg.text)} />
            </div>
            <p className="text-xs text-text-muted">
              {data.responses_count} surveys · Avg quality {data.avg_quality_score}%
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className={cn('text-sm font-bold', qMultiplier.color)}>
            {qMultiplier.label}
          </span>
          <span className="text-[10px] text-text-muted">multiplier</span>
        </div>
      </div>

      {/* Warning count */}
      {data.warning_count > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-warning-50 border border-warning-200 px-3 py-2">
          <AlertTriangle className="h-3.5 w-3.5 text-warning-600 shrink-0" />
          <p className="text-xs text-warning-700">
            {data.warning_count} warning{data.warning_count > 1 ? 's' : ''} — improve response quality to avoid suspension
          </p>
        </div>
      )}

      {/* Progress toward next level */}
      {!isMaxLevel && data.next_threshold && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Progress to Level {data.next_level} ({data.next_level_label})
            </p>
            {responsesNeeded === 0 && qualityNeeded === 0 && (
              <span className="text-[10px] font-semibold text-green-600">Ready to upgrade!</span>
            )}
          </div>

          {/* Responses bar */}
          <div>
            <div className="flex justify-between text-[10px] text-text-muted mb-1">
              <span>Surveys completed</span>
              <span>{data.responses_count} / {data.next_threshold.min_responses}
                {responsesNeeded > 0 && <span className="text-warning-600 ml-1">({responsesNeeded} more)</span>}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/60 overflow-hidden border border-white/40">
              <div
                className={cn('h-full rounded-full transition-all', responsesProgress >= 100 ? 'bg-green-500' : 'bg-sky-500')}
                style={{ width: `${responsesProgress}%` }}
              />
            </div>
          </div>

          {/* Quality bar */}
          <div>
            <div className="flex justify-between text-[10px] text-text-muted mb-1">
              <span>Avg quality score</span>
              <span>{data.avg_quality_score}% / {data.next_threshold.min_quality}%
                {qualityNeeded > 0 && <span className="text-warning-600 ml-1">({qualityNeeded}% more)</span>}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/60 overflow-hidden border border-white/40">
              <div
                className={cn('h-full rounded-full transition-all', qualityProgress >= 100 ? 'bg-green-500' : 'bg-amber-500')}
                style={{ width: `${qualityProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {isMaxLevel && (
        <div className="flex items-center gap-2 text-xs text-amber-700">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          You've reached the highest trust level. Maximum rewards unlocked!
        </div>
      )}

      {/* Current level perks */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-1.5 text-xs font-medium text-text-secondary list-none">
          <ChevronRight className="h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          Your level perks
        </summary>
        <ul className="mt-2 space-y-1 pl-5">
          {perks.map((perk) => (
            <li key={perk} className="text-xs text-text-muted list-disc">{perk}</li>
          ))}
        </ul>
      </details>
    </div>
  )
}
