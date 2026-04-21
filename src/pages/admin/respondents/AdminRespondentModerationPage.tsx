import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Ban, CheckCircle2, ChevronRight, Shield, ShieldOff, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow } from 'date-fns'

interface ModerationRespondent {
  id: string
  full_name: string
  email: string
  trust_level: number
  profile_score: number
  surveys_completed: number
  total_earned: number
  warning_count: number
  status: 'active' | 'warned' | 'suspended'
  joined_at: string
  avg_quality_score: number
  last_active_at: string
}

type FilterTab = 'warned' | 'suspended' | 'all'

const TRUST_LABELS: Record<number, string> = {
  1: 'New',
  2: 'Basic',
  3: 'Trusted',
  4: 'Premium',
  5: 'Elite',
}

function qualityColor(score: number) {
  if (score >= 80) return 'text-success-600'
  if (score >= 65) return 'text-yellow-600'
  return 'text-red-600'
}

function warningColor(count: number) {
  if (count === 0) return 'bg-gray-100 text-gray-500'
  if (count <= 2) return 'bg-yellow-100 text-yellow-700'
  return 'bg-red-100 text-red-700'
}

export default function AdminRespondentModerationPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterTab>('warned')

  const { data: respondents = [], isLoading } = useQuery<ModerationRespondent[]>({
    queryKey: ['admin', 'respondents'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/respondents')
      return data as ModerationRespondent[]
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'warn' | 'suspend' | 'reinstate' | 'clear_warnings' }) => {
      await apiClient.patch(`/admin/respondents/${id}/status`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'respondents'] }),
  })

  const counts = {
    warned: respondents.filter((r) => r.status === 'warned').length,
    suspended: respondents.filter((r) => r.status === 'suspended').length,
    all: respondents.filter((r) => r.status !== 'active').length,
  }

  const filtered = respondents.filter((r) => {
    if (filter === 'all') return r.status !== 'active'
    return r.status === filter
  })

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Respondent Moderation</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Manage warned and suspended respondent accounts
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { label: 'Warned', count: counts.warned, icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
          { label: 'Suspended', count: counts.suspended, icon: Ban, color: 'text-red-600 bg-red-50 border-red-200' },
          { label: 'Total Flagged', count: counts.all, icon: ShieldOff, color: 'text-text-secondary bg-gray-50 border-border' },
        ] as const).map((s) => (
          <div key={s.label} className={cn('rounded-xl border p-4 flex items-start gap-3', s.color)}>
            <s.icon className="h-5 w-5 mt-0.5 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-medium mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex rounded-lg border border-border bg-white p-1 gap-0.5 w-fit">
        {([
          { key: 'warned' as FilterTab, label: 'Warned' },
          { key: 'suspended' as FilterTab, label: 'Suspended' },
          { key: 'all' as FilterTab, label: 'All Flagged' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5',
              filter === tab.key ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50'
            )}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                filter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-text-muted'
              )}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Respondent table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Respondent</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Warnings</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Trust Level</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Quality Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Surveys Done</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Last Active</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={8} className="px-5 py-4">
                    <div className="h-4 rounded bg-gray-100 animate-pulse" />
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center">
                    <Shield className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-medium text-text-secondary">No {filter} respondents</p>
                    <p className="text-xs text-text-muted mt-1">All clear in this category</p>
                  </td>
                </tr>
              )}

              {!isLoading && filtered.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                  {/* Name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {r.full_name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          to={ROUTES.ADMIN_RESPONDENT_DETAIL(r.id)}
                          className="text-sm font-medium text-text-primary hover:text-violet-600 transition-colors flex items-center gap-1"
                        >
                          {r.full_name}
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                        <p className="text-xs text-text-muted">{r.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    {r.status === 'warned' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-yellow-50 text-yellow-700 border-yellow-200">
                        <AlertTriangle className="h-3 w-3" /> Warned
                      </span>
                    )}
                    {r.status === 'suspended' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-red-50 text-red-600 border-red-200">
                        <Ban className="h-3 w-3" /> Suspended
                      </span>
                    )}
                  </td>

                  {/* Warning count */}
                  <td className="px-4 py-4">
                    <span className={cn('inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold', warningColor(r.warning_count))}>
                      {r.warning_count}
                    </span>
                  </td>

                  {/* Trust level */}
                  <td className="px-4 py-4">
                    <span className="text-xs font-medium text-text-secondary">
                      L{r.trust_level} — {TRUST_LABELS[r.trust_level] ?? 'Unknown'}
                    </span>
                  </td>

                  {/* Quality score */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100">
                        <div
                          className={cn('h-1.5 rounded-full', r.avg_quality_score >= 80 ? 'bg-success-500' : r.avg_quality_score >= 65 ? 'bg-yellow-400' : 'bg-red-400')}
                          style={{ width: `${r.avg_quality_score}%` }}
                        />
                      </div>
                      <span className={cn('text-xs font-medium', qualityColor(r.avg_quality_score))}>
                        {r.avg_quality_score}%
                      </span>
                    </div>
                  </td>

                  {/* Surveys */}
                  <td className="px-4 py-4 text-sm text-text-primary font-medium">{r.surveys_completed}</td>

                  {/* Last active */}
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(r.last_active_at), { addSuffix: true })}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {r.status === 'warned' && (
                        <>
                          <button
                            onClick={() => actionMutation.mutate({ id: r.id, action: 'clear_warnings' })}
                            disabled={actionMutation.isPending}
                            className="flex items-center gap-1 rounded-lg bg-success-600 hover:bg-success-700 disabled:opacity-60 px-2.5 py-1 text-xs font-medium text-white transition-colors"
                          >
                            <CheckCircle2 className="h-3 w-3" /> Clear
                          </button>
                          <button
                            onClick={() => actionMutation.mutate({ id: r.id, action: 'suspend' })}
                            disabled={actionMutation.isPending}
                            className="flex items-center gap-1 rounded-lg border border-red-200 hover:bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors"
                          >
                            <Ban className="h-3 w-3" /> Suspend
                          </button>
                        </>
                      )}
                      {r.status === 'suspended' && (
                        <button
                          onClick={() => actionMutation.mutate({ id: r.id, action: 'reinstate' })}
                          disabled={actionMutation.isPending}
                          className="flex items-center gap-1 rounded-lg bg-success-600 hover:bg-success-700 disabled:opacity-60 px-2.5 py-1 text-xs font-medium text-white transition-colors"
                        >
                          <User className="h-3 w-3" /> Reinstate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
