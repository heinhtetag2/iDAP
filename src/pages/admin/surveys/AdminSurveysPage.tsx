import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Pause, Play, XCircle, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib'
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

export default function AdminSurveysPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_TABS[number]>('all')
  const [catFilter, setCatFilter] = useState<typeof CATEGORIES[number]>('all')
  const [search, setSearch] = useState('')

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

  return (
    <div className="space-y-6 max-w-6xl">
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
                <tr key={s.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <Link to={ROUTES.ADMIN_SURVEY_DETAIL(s.id)} className="text-sm font-medium text-text-primary hover:text-violet-600 transition-colors block max-w-xs truncate">{s.title}</Link>
                    <p className="text-xs text-text-muted capitalize">{s.category.replace('_', ' ')}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-secondary">{s.company_name}</td>
                  <td className="px-4 py-4"><span className={statusBadgeClass(s.status)}>{s.status}</span></td>
                  <td className="px-4 py-4 text-sm text-text-primary">
                    {s.current_responses}/{s.max_responses}
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-text-primary">₮{s.reward_amount.toLocaleString()}</td>
                  <td className="px-4 py-4 text-xs text-text-secondary">Level {s.trust_level_required}+</td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {s.status === 'active' && (
                        <button onClick={() => actionMutation.mutate({ id: s.id, action: 'pause' })}
                          className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600" title="Pause">
                          <Pause className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {s.status === 'paused' && (
                        <button onClick={() => actionMutation.mutate({ id: s.id, action: 'resume' })}
                          className="p-1.5 rounded hover:bg-success-50 text-success-600" title="Resume">
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {s.status !== 'rejected' && s.status !== 'completed' && (
                        <button onClick={() => actionMutation.mutate({ id: s.id, action: 'reject' })}
                          className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Reject">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
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
    </div>
  )
}
