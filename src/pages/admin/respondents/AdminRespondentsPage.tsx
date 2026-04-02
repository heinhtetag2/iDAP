import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, ShieldCheck, AlertTriangle, Ban, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib'
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
  status: 'active' | 'warned' | 'suspended'
  joined_at: string
}

const TRUST_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']

function TrustBadge({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={cn('h-2 w-2 rounded-full', i < level ? TRUST_COLORS[level] : 'bg-gray-200')}
          />
        ))}
      </div>
      <span className="text-xs text-text-muted">L{level}</span>
    </div>
  )
}

export default function AdminRespondentsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [trustFilter, setTrustFilter] = useState<number | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'warned' | 'suspended'>('all')

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

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Respondents</h1>
        <p className="text-sm text-text-secondary mt-0.5">{respondents.length} registered respondents</p>
      </div>

      {/* Filters */}
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
          <button onClick={() => setStatusFilter('all')}
            className={cn('px-2.5 py-1 rounded-md text-xs font-medium', statusFilter === 'all' ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>
            All
          </button>
          {(['active', 'warned', 'suspended'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-2.5 py-1 rounded-md text-xs font-medium capitalize', statusFilter === s ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          <button onClick={() => setTrustFilter('all')}
            className={cn('px-2.5 py-1 rounded-md text-xs font-medium', trustFilter === 'all' ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>
            All Levels
          </button>
          {[1, 2, 3, 4, 5].map((l) => (
            <button key={l} onClick={() => setTrustFilter(l)}
              className={cn('px-2.5 py-1 rounded-md text-xs font-medium', trustFilter === l ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>
              L{l}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Trust</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Profile</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Surveys</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Earned</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Warnings</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={8} className="px-5 py-4"><div className="h-4 rounded bg-gray-100 animate-pulse" /></td>
                </tr>
              ))}
              {!isLoading && filtered.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-700">
                        {r.full_name.charAt(0)}
                      </div>
                      <div>
                        <Link to={ROUTES.ADMIN_RESPONDENT_DETAIL(r.id)} className="text-sm font-medium text-text-primary hover:text-violet-600 transition-colors">{r.full_name}</Link>
                        <p className="text-xs text-text-muted">{r.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><TrustBadge level={r.trust_level} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-500" style={{ width: `${r.profile_score}%` }} />
                      </div>
                      <span className="text-xs text-text-muted">{r.profile_score}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-primary font-medium">{r.surveys_completed}</td>
                  <td className="px-4 py-4 text-sm text-text-primary">₮{r.total_earned.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className={cn('text-xs font-medium', r.warning_count > 2 ? 'text-red-600' : r.warning_count > 0 ? 'text-warning-600' : 'text-text-muted')}>
                      {r.warning_count}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium border capitalize',
                      r.status === 'active' ? 'bg-success-50 text-success-700 border-success-200' :
                      r.status === 'warned' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-red-50 text-red-600 border-red-200'
                    )}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      {r.status !== 'warned' && r.status !== 'suspended' && (
                        <button onClick={() => actionMutation.mutate({ id: r.id, action: 'warn' })}
                          title="Issue warning"
                          className="p-1.5 rounded hover:bg-yellow-50 text-yellow-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {r.status !== 'suspended' ? (
                        <button onClick={() => actionMutation.mutate({ id: r.id, action: 'suspend' })}
                          title="Suspend user"
                          className="p-1.5 rounded hover:bg-red-50 text-red-500">
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => actionMutation.mutate({ id: r.id, action: 'unsuspend' })}
                          title="Reinstate user"
                          className="p-1.5 rounded hover:bg-success-50 text-success-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-text-muted">No respondents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
