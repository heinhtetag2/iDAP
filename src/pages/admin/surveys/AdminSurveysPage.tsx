import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Pause, Play, XCircle, Building2, Users, DollarSign } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Tooltip, SlidePanel } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow } from 'date-fns'

interface AdminSurvey {
  id: string
  title: string
  company_name: string
  category: string
  status: 'active' | 'paused' | 'completed' | 'rejected'
  current_responses: number
  max_responses: number
  reward_amount: number
  trust_level_required: number
  created_at: string
}

const STATUS_TABS = ['all', 'active', 'paused', 'completed', 'rejected'] as const
const CATEGORIES = ['all', 'market_research', 'brand', 'product', 'hr', 'social', 'other'] as const

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    active: 'bg-success-50 text-success-700 border-success-200',
    paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    completed: 'bg-gray-100 text-gray-600 border-gray-200',
    rejected: 'bg-red-50 text-red-600 border-red-200',
  }
  return cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', map[status] ?? 'bg-gray-100 text-gray-600')
}

function SurveyPanel({
  survey,
  onAction,
}: {
  survey: AdminSurvey
  onAction: (id: string, action: 'pause' | 'resume' | 'reject') => void
}) {
  const pct = Math.round((survey.current_responses / survey.max_responses) * 100)

  return (
    <div className="p-5 space-y-5">
      {/* Title + company */}
      <div>
        <p className="font-semibold text-text-primary leading-snug">{survey.title}</p>
        <p className="text-sm text-text-muted mt-0.5 capitalize">{survey.category.replace('_', ' ')}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={statusBadgeClass(survey.status)}>{survey.status}</span>
          <span className="text-xs text-text-muted">Level {survey.trust_level_required}+ required</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Building2,  label: 'Company',   value: survey.company_name.split(' ')[0]!, color: 'text-indigo-600 bg-indigo-50' },
          { icon: Users,      label: 'Responses', value: `${survey.current_responses}/${survey.max_responses}`, color: 'text-violet-600 bg-violet-50' },
          { icon: DollarSign, label: 'Reward',    value: `₮${survey.reward_amount.toLocaleString()}`, color: 'text-orange-600 bg-orange-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border p-3 text-center">
            <div className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg mb-1.5', color)}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-text-primary truncate">{value}</p>
            <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Response progress */}
      <div className="rounded-xl border border-border p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Response progress</span>
          <span className="font-semibold text-text-primary">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', pct >= 90 ? 'bg-success-500' : pct >= 50 ? 'bg-indigo-500' : 'bg-gray-400')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-text-muted">{survey.current_responses} of {survey.max_responses} responses collected</p>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border divide-y divide-border">
        {[
          { label: 'Company',   value: survey.company_name },
          { label: 'Created',   value: formatDistanceToNow(new Date(survey.created_at), { addSuffix: true }) },
          { label: 'Trust req.', value: `Level ${survey.trust_level_required}+` },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
            <span className="text-text-muted">{label}</span>
            <span className="font-medium text-text-primary text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {survey.status === 'active' && (
          <button
            onClick={() => onAction(survey.id, 'pause')}
            className="w-full rounded-xl border border-yellow-200 hover:bg-yellow-50 py-2 text-sm font-medium text-yellow-700 transition-colors flex items-center justify-center gap-2"
          >
            <Pause className="h-4 w-4" /> Pause survey
          </button>
        )}
        {survey.status === 'paused' && (
          <button
            onClick={() => onAction(survey.id, 'resume')}
            className="w-full rounded-xl bg-success-600 hover:bg-success-700 py-2 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <Play className="h-4 w-4" /> Resume survey
          </button>
        )}
        {survey.status !== 'rejected' && survey.status !== 'completed' && (
          <button
            onClick={() => onAction(survey.id, 'reject')}
            className="w-full rounded-xl border border-red-200 hover:bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="h-4 w-4" /> Reject survey
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminSurveysPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_TABS[number]>('all')
  const [catFilter, setCatFilter] = useState<typeof CATEGORIES[number]>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: surveys = [], isLoading } = useQuery<AdminSurvey[]>({
    queryKey: ['admin', 'surveys'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/surveys')
      return data as AdminSurvey[]
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'pause' | 'resume' | 'reject' }) => {
      await apiClient.patch(`/admin/surveys/${id}/moderate`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'surveys'] }),
  })

  const filtered = surveys.filter((s) => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    const matchCat = catFilter === 'all' || s.category === catFilter
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
                        s.company_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchCat && matchSearch
  })

  const selected = surveys.find((s) => s.id === selectedId) ?? null

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Survey Moderation</h1>
        <p className="text-sm text-text-secondary mt-0.5">{surveys.length} total surveys across all companies</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surveys or companies…"
            className="h-9 w-64 rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          {STATUS_TABS.map((tab) => (
            <button key={tab} onClick={() => setStatusFilter(tab)}
              className={cn('px-2.5 py-1 rounded-md text-xs font-medium capitalize', statusFilter === tab ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>
              {tab}
            </button>
          ))}
        </div>

        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value as typeof catFilter)}
          className="h-9 rounded-lg border border-border bg-white px-3 text-xs text-text-secondary focus:outline-none focus:ring-2 focus:ring-violet-500">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c === 'all' ? 'All categories' : c.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Survey</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Company</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Responses</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Reward</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Trust Req.</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={8} className="px-5 py-4"><div className="h-4 rounded bg-gray-100 animate-pulse" /></td>
                </tr>
              ))}
              {!isLoading && filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={cn('border-b border-border hover:bg-gray-50 transition-colors cursor-pointer', selectedId === s.id && 'bg-violet-50')}
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-text-primary max-w-xs truncate">{s.title}</p>
                    <p className="text-xs text-text-muted capitalize">{s.category.replace('_', ' ')}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-secondary">{s.company_name}</td>
                  <td className="px-4 py-4"><span className={statusBadgeClass(s.status)}>{s.status}</span></td>
                  <td className="px-4 py-4 text-sm text-text-primary">
                    {s.current_responses}/{s.max_responses}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-text-primary">₮{s.reward_amount.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <Tooltip content={`Only respondents at Level ${s.trust_level_required} or above can take this survey.`} position="bottom">
                      <span className="text-xs text-text-secondary cursor-default">Level {s.trust_level_required}+</span>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {s.status === 'active' && (
                        <Tooltip content="Pause this survey — stops accepting new responses temporarily." position="bottom">
                          <button onClick={() => actionMutation.mutate({ id: s.id, action: 'pause' })} className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600">
                            <Pause className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                      {s.status === 'paused' && (
                        <Tooltip content="Resume this survey — allows respondents to submit again." position="bottom">
                          <button onClick={() => actionMutation.mutate({ id: s.id, action: 'resume' })} className="p-1.5 rounded hover:bg-success-50 text-success-600">
                            <Play className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                      {s.status !== 'rejected' && s.status !== 'completed' && (
                        <Tooltip content="Reject this survey — permanently removes it from the platform." position="bottom">
                          <button onClick={() => actionMutation.mutate({ id: s.id, action: 'reject' })} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-text-muted">No surveys found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <SlidePanel
          isOpen={!!selectedId}
          onClose={() => setSelectedId(null)}
          title={selected.title}
          subtitle={<p className="text-xs text-text-muted">{selected.company_name}</p>}
          fullPageHref={ROUTES.ADMIN_SURVEY_DETAIL(selected.id)}
        >
          <SurveyPanel
            survey={selected}
            onAction={(id, action) => { actionMutation.mutate({ id, action }) }}
          />
        </SlidePanel>
      )}
    </div>
  )
}
