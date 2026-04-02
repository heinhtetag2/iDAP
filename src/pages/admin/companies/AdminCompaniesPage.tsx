import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle2, XCircle, Clock, Ban, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow } from 'date-fns'

interface Company {
  id: string
  company_name: string
  email: string
  status: 'pending' | 'approved' | 'suspended'
  plan: 'starter' | 'growth' | 'enterprise'
  surveys_count: number
  total_spent: number
  joined_at: string
}

const STATUS_TABS = ['all', 'pending', 'approved', 'suspended'] as const

function statusBadge(status: string) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    pending: { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
    approved: { cls: 'bg-success-50 text-success-700 border-success-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Approved' },
    suspended: { cls: 'bg-red-50 text-red-600 border-red-200', icon: <Ban className="h-3 w-3" />, label: 'Suspended' },
  }
  const c = cfg[status] ?? cfg.pending!
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', c.cls)}>
      {c.icon} {c.label}
    </span>
  )
}

function planBadge(plan: string) {
  const cls = plan === 'enterprise' ? 'bg-yellow-100 text-yellow-700' : plan === 'growth' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', cls)}>{plan}</span>
}

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<typeof STATUS_TABS[number]>('all')
  const [search, setSearch] = useState('')

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/companies')
      return data as Company[]
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'suspend' | 'unsuspend' }) => {
      await apiClient.patch(`/admin/companies/${id}/status`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] }),
  })

  const filtered = companies.filter((c) => {
    const matchFilter = filter === 'all' || c.status === filter
    const matchSearch = c.company_name.toLowerCase().includes(search.toLowerCase()) ||
                        c.email.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  const counts = {
    pending: companies.filter((c) => c.status === 'pending').length,
    approved: companies.filter((c) => c.status === 'approved').length,
    suspended: companies.filter((c) => c.status === 'suspended').length,
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Companies</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {companies.length} total · {counts.pending} pending · {counts.approved} approved
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex rounded-lg border border-border bg-white p-1 gap-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors',
                filter === tab ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50'
              )}
            >
              {tab}
              {tab !== 'all' && counts[tab] > 0 && (
                <span className={cn('ml-1.5 text-xs', filter === tab ? 'opacity-80' : 'opacity-60')}>
                  {counts[tab as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies…"
            className="h-9 w-56 rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Company</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Plan</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Surveys</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Total Spent</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={7} className="px-5 py-4">
                    <div className="h-4 rounded bg-gray-100 animate-pulse" />
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.map((c) => (
                <tr key={c.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                        {c.company_name.charAt(0)}
                      </div>
                      <div>
                        <Link to={ROUTES.ADMIN_COMPANY_DETAIL(c.id)} className="text-sm font-medium text-text-primary hover:text-violet-600 transition-colors">{c.company_name}</Link>
                        <p className="text-xs text-text-muted">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">{statusBadge(c.status)}</td>
                  <td className="px-4 py-4">{planBadge(c.plan)}</td>
                  <td className="px-4 py-4 text-sm text-text-primary font-medium">{c.surveys_count}</td>
                  <td className="px-4 py-4 text-sm text-text-primary">₮{(c.total_spent / 1000).toFixed(0)}K</td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(c.joined_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      {c.status === 'pending' && (
                        <>
                          <button
                            onClick={() => actionMutation.mutate({ id: c.id, action: 'approve' })}
                            className="rounded-lg bg-success-600 hover:bg-success-700 px-2.5 py-1 text-xs font-medium text-white transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => actionMutation.mutate({ id: c.id, action: 'suspend' })}
                            className="rounded-lg border border-border hover:bg-gray-50 px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {c.status === 'approved' && (
                        <button
                          onClick={() => actionMutation.mutate({ id: c.id, action: 'suspend' })}
                          className="rounded-lg border border-red-200 hover:bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors flex items-center gap-1"
                        >
                          <Ban className="h-3 w-3" /> Suspend
                        </button>
                      )}
                      {c.status === 'suspended' && (
                        <button
                          onClick={() => actionMutation.mutate({ id: c.id, action: 'unsuspend' })}
                          className="rounded-lg bg-success-600 hover:bg-success-700 px-2.5 py-1 text-xs font-medium text-white transition-colors"
                        >
                          Reinstate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-text-muted">
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
