import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, AlertTriangle, Ban, CheckCircle2, Star, FileText, DollarSign } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Tooltip, SlidePanel } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow } from 'date-fns'

interface Respondent {
  id: string
  full_name: string
  email: string
  trust_level: number
  profile_score: number
  surveys_completed: number
  total_earned: number
  warning_count: number
  avg_quality_score: number
  last_active_at: string
  status: 'active' | 'warned' | 'suspended'
  joined_at: string
}

const TRUST_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']
const TRUST_LABELS = ['', 'New', 'Basic', 'Trusted', 'Premium', 'Elite']

function TrustBadge({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn('h-2 w-2 rounded-full', i < level ? TRUST_COLORS[level] : 'bg-gray-200')} />
        ))}
      </div>
      <span className="text-xs text-text-muted">L{level}</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'active' ? 'bg-success-50 text-success-700 border-success-200'
    : status === 'warned' ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
    : 'bg-red-50 text-red-600 border-red-200'
  return <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border capitalize', cls)}>{status}</span>
}

function RespondentPanel({
  respondent,
  onAction,
}: {
  respondent: Respondent
  onAction: (id: string, action: 'warn' | 'suspend' | 'unsuspend') => void
}) {
  const qualityTier = respondent.avg_quality_score >= 80 ? 'High' : respondent.avg_quality_score >= 65 ? 'Medium' : 'Low'
  const qualityColor = respondent.avg_quality_score >= 80 ? 'text-success-700' : respondent.avg_quality_score >= 65 ? 'text-yellow-700' : 'text-red-600'
  const qualityBg = respondent.avg_quality_score >= 80 ? 'bg-success-500' : respondent.avg_quality_score >= 65 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="p-5 space-y-5">
      {/* Avatar + identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">
          {respondent.full_name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-text-primary">{respondent.full_name}</p>
          <p className="text-sm text-text-muted">{respondent.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={respondent.status} />
            <TrustBadge level={respondent.trust_level} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: FileText,   label: 'Surveys',   value: respondent.surveys_completed, color: 'text-indigo-600 bg-indigo-50' },
          { icon: DollarSign, label: 'Earned',     value: `₮${(respondent.total_earned / 1000).toFixed(0)}K`, color: 'text-orange-600 bg-orange-50' },
          { icon: Star,       label: 'Trust',      value: `L${respondent.trust_level} ${TRUST_LABELS[respondent.trust_level]}`, color: 'text-violet-600 bg-violet-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border p-3 text-center">
            <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg mb-1.5', color)}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-text-primary">{value}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quality score bar */}
      <div className="rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary">Quality Score</span>
          <span className={cn('text-sm font-bold', qualityColor)}>{respondent.avg_quality_score}% — {qualityTier}</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', qualityBg)} style={{ width: `${respondent.avg_quality_score}%` }} />
        </div>
        <p className="text-xs text-text-muted">
          {respondent.avg_quality_score >= 80 ? '×1.1–×1.2 reward bonus' : respondent.avg_quality_score >= 65 ? 'Standard reward rate' : 'Reduced rewards — warning risk'}
        </p>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border divide-y divide-border">
        {[
          { label: 'Warnings',     value: respondent.warning_count === 0 ? 'None' : `${respondent.warning_count}` },
          { label: 'Last active',  value: formatDistanceToNow(new Date(respondent.last_active_at), { addSuffix: true }) },
          { label: 'Profile score', value: `${respondent.profile_score}%` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
            <span className="text-text-muted">{label}</span>
            <span className="font-medium text-text-primary">{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {respondent.status !== 'warned' && respondent.status !== 'suspended' && (
          <button
            onClick={() => onAction(respondent.id, 'warn')}
            className="w-full rounded-xl border border-yellow-200 hover:bg-yellow-50 py-2 text-sm font-medium text-yellow-700 transition-colors flex items-center justify-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" /> Issue warning
          </button>
        )}
        {respondent.status !== 'suspended' ? (
          <button
            onClick={() => onAction(respondent.id, 'suspend')}
            className="w-full rounded-xl border border-red-200 hover:bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <Ban className="h-4 w-4" /> Suspend account
          </button>
        ) : (
          <button
            onClick={() => onAction(respondent.id, 'unsuspend')}
            className="w-full rounded-xl bg-success-600 hover:bg-success-700 py-2 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" /> Reinstate account
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminRespondentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [trustFilter, setTrustFilter] = useState<number | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warned' | 'suspended'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: respondents = [], isLoading } = useQuery<Respondent[]>({
    queryKey: ['admin', 'respondents'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/respondents')
      return data as Respondent[]
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'warn' | 'suspend' | 'unsuspend' }) => {
      await apiClient.patch(`/admin/respondents/${id}/status`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'respondents'] }),
  })

  const filtered = respondents.filter((r) => {
    const matchSearch = r.full_name.toLowerCase().includes(search.toLowerCase()) ||
                        r.email.toLowerCase().includes(search.toLowerCase())
    const matchTrust = trustFilter === 'all' || r.trust_level === trustFilter
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    return matchSearch && matchTrust && matchStatus
  })

  const selected = respondents.find((r) => r.id === selectedId) ?? null

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Respondents</h1>
        <p className="text-sm text-text-secondary mt-0.5">{respondents.length} registered respondents</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search respondents…"
            className="h-9 w-56 rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          <button onClick={() => setStatusFilter('all')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium', statusFilter === 'all' ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>All</button>
          {(['active', 'warned', 'suspended'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-2.5 py-1 rounded-md text-xs font-medium capitalize', statusFilter === s ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>{s}</button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          <button onClick={() => setTrustFilter('all')} className={cn('px-2.5 py-1 rounded-md text-xs font-medium', trustFilter === 'all' ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>All Levels</button>
          {[1, 2, 3, 4, 5].map((l) => (
            <button key={l} onClick={() => setTrustFilter(l)} className={cn('px-2.5 py-1 rounded-md text-xs font-medium', trustFilter === l ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>L{l}</button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Trust</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Surveys</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Quality Score</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Earned</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Last Active</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Warnings</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={9} className="px-5 py-4"><div className="h-4 rounded bg-gray-100 animate-pulse" /></td>
                </tr>
              ))}
              {!isLoading && filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn('border-b border-border hover:bg-gray-50 transition-colors cursor-pointer', selectedId === r.id && 'bg-violet-50')}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">{r.full_name.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{r.full_name}</p>
                        <p className="text-xs text-text-muted">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Tooltip content={`Level ${r.trust_level} — ${TRUST_LABELS[r.trust_level]}. Higher levels unlock better-paying surveys.`} position="bottom">
                      <span><TrustBadge level={r.trust_level} /></span>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-primary font-medium">{r.surveys_completed}</td>
                  <td className="px-4 py-4">
                    <Tooltip
                      content={r.avg_quality_score >= 80 ? `High quality — earns ×1.1–×1.2 reward bonus` : r.avg_quality_score >= 65 ? `Average quality — standard reward rate` : `Low quality — reduced rewards, warning risk`}
                      position="bottom"
                    >
                      <span className="flex items-center gap-1.5">
                        <div className="w-10 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={cn('h-full rounded-full', r.avg_quality_score >= 80 ? 'bg-green-500' : r.avg_quality_score >= 65 ? 'bg-yellow-500' : 'bg-red-500')} style={{ width: `${r.avg_quality_score}%` }} />
                        </div>
                        <span className={cn('text-xs font-semibold', r.avg_quality_score >= 80 ? 'text-success-700' : r.avg_quality_score >= 65 ? 'text-yellow-700' : 'text-red-600')}>{r.avg_quality_score}%</span>
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-primary">₮{r.total_earned.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs text-text-muted whitespace-nowrap">{formatDistanceToNow(new Date(r.last_active_at), { addSuffix: true })}</td>
                  <td className="px-4 py-4">
                    <Tooltip
                      content={r.warning_count === 0 ? 'No warnings — good standing' : r.warning_count <= 2 ? `${r.warning_count} warning${r.warning_count > 1 ? 's' : ''} — monitor closely` : `${r.warning_count} warnings — suspension risk`}
                      position="bottom"
                    >
                      <span className={cn('text-xs font-medium cursor-default', r.warning_count > 2 ? 'text-red-600' : r.warning_count > 0 ? 'text-warning-600' : 'text-text-muted')}>{r.warning_count}</span>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {r.status !== 'warned' && r.status !== 'suspended' && (
                        <Tooltip content="Issue a formal warning. 3+ warnings will trigger suspension." position="top">
                          <button onClick={() => actionMutation.mutate({ id: r.id, action: 'warn' })} className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600">
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                      {r.status !== 'suspended' ? (
                        <Tooltip content="Suspend this account. They will lose access until reinstated." position="top">
                          <button onClick={() => actionMutation.mutate({ id: r.id, action: 'suspend' })} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                            <Ban className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      ) : (
                        <Tooltip content="Reinstate account and clear all warnings." position="top">
                          <button onClick={() => actionMutation.mutate({ id: r.id, action: 'unsuspend' })} className="p-1.5 rounded hover:bg-success-50 text-success-600">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-sm text-text-muted">No respondents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <SlidePanel
          isOpen={!!selectedId}
          onClose={() => setSelectedId(null)}
          title={selected.full_name}
          subtitle={<p className="text-xs text-text-muted">{selected.email}</p>}
          fullPageHref={ROUTES.ADMIN_RESPONDENT_DETAIL(selected.id)}
        >
          <RespondentPanel
            respondent={selected}
            onAction={(id, action) => { actionMutation.mutate({ id, action }) }}
          />
        </SlidePanel>
      )}
    </div>
  )
}
