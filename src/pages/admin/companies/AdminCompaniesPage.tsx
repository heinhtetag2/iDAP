import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, CheckCircle2, Clock, Ban, Building2, FileText, DollarSign } from 'lucide-react'
import { cn } from '@/shared/lib'
import { SlidePanel } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow, format } from 'date-fns'

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

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    pending:   { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',   icon: <Clock className="h-3 w-3" />,       label: 'Pending' },
    approved:  { cls: 'bg-success-50 text-success-700 border-success-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Approved' },
    suspended: { cls: 'bg-red-50 text-red-600 border-red-200',             icon: <Ban className="h-3 w-3" />,          label: 'Suspended' },
  }
  const c = cfg[status] ?? cfg.pending!
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', c.cls)}>
      {c.icon} {c.label}
    </span>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  const cls = plan === 'enterprise' ? 'bg-yellow-100 text-yellow-700' : plan === 'growth' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
  return <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', cls)}>{plan}</span>
}

function CompanyPanel({ company, onAction }: { company: Company; onAction: (id: string, action: 'approve' | 'suspend' | 'unsuspend') => void }) {
  return (
    <div className="p-5 space-y-5">
      {/* Avatar + identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
          {company.company_name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-text-primary">{company.company_name}</p>
          <p className="text-sm text-text-muted">{company.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge status={company.status} />
            <PlanBadge plan={company.plan} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: FileText,   label: 'Surveys',     value: company.surveys_count, color: 'text-indigo-600 bg-indigo-50' },
          { icon: DollarSign, label: 'Total Spent',  value: `₮${(company.total_spent / 1000).toFixed(0)}K`, color: 'text-orange-600 bg-orange-50' },
          { icon: Building2,  label: 'Plan',         value: company.plan.charAt(0).toUpperCase() + company.plan.slice(1), color: 'text-violet-600 bg-violet-50' },
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

      {/* Details */}
      <div className="rounded-xl border border-border divide-y divide-border">
        {[
          { label: 'Email',   value: company.email },
          { label: 'Joined',  value: format(new Date(company.joined_at), 'MMM d, yyyy') },
          { label: 'Active',  value: formatDistanceToNow(new Date(company.joined_at), { addSuffix: true }) },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
            <span className="text-text-muted">{label}</span>
            <span className="font-medium text-text-primary text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {company.status === 'pending' && (
          <>
            <button onClick={() => onAction(company.id, 'approve')} className="w-full rounded-xl bg-success-600 hover:bg-success-700 py-2 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Approve company
            </button>
            <button onClick={() => onAction(company.id, 'suspend')} className="w-full rounded-xl border border-border hover:bg-gray-50 py-2 text-sm font-medium text-text-secondary transition-colors">
              Reject
            </button>
          </>
        )}
        {company.status === 'approved' && (
          <button onClick={() => onAction(company.id, 'suspend')} className="w-full rounded-xl border border-red-200 hover:bg-red-50 py-2 text-sm font-medium text-red-600 transition-colors flex items-center justify-center gap-2">
            <Ban className="h-4 w-4" /> Suspend account
          </button>
        )}
        {company.status === 'suspended' && (
          <button onClick={() => onAction(company.id, 'unsuspend')} className="w-full rounded-xl bg-success-600 hover:bg-success-700 py-2 text-sm font-semibold text-white transition-colors">
            Reinstate account
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<typeof STATUS_TABS[number]>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
    pending:   companies.filter((c) => c.status === 'pending').length,
    approved:  companies.filter((c) => c.status === 'approved').length,
    suspended: companies.filter((c) => c.status === 'suspended').length,
  }

  const selected = companies.find((c) => c.id === selectedId) ?? null

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Companies</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          {companies.length} total · {counts.pending} pending · {counts.approved} approved
        </p>
      </div>

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
              {tab !== 'all' && counts[tab as keyof typeof counts] > 0 && (
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
                <tr
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={cn('border-b border-border hover:bg-gray-50 transition-colors cursor-pointer', selectedId === c.id && 'bg-violet-50')}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                        {c.company_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{c.company_name}</p>
                        <p className="text-xs text-text-muted">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-4"><PlanBadge plan={c.plan} /></td>
                  <td className="px-4 py-4 text-sm text-text-primary font-medium">{c.surveys_count}</td>
                  <td className="px-4 py-4 text-sm text-text-primary">₮{(c.total_spent / 1000).toFixed(0)}K</td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(c.joined_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {c.status === 'pending' && (
                        <>
                          <button onClick={() => actionMutation.mutate({ id: c.id, action: 'approve' })} className="rounded-lg bg-success-600 hover:bg-success-700 px-2.5 py-1 text-xs font-medium text-white transition-colors">Approve</button>
                          <button onClick={() => actionMutation.mutate({ id: c.id, action: 'suspend' })} className="rounded-lg border border-border hover:bg-gray-50 px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors">Reject</button>
                        </>
                      )}
                      {c.status === 'approved' && (
                        <button onClick={() => actionMutation.mutate({ id: c.id, action: 'suspend' })} className="rounded-lg border border-red-200 hover:bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors flex items-center gap-1">
                          <Ban className="h-3 w-3" /> Suspend
                        </button>
                      )}
                      {c.status === 'suspended' && (
                        <button onClick={() => actionMutation.mutate({ id: c.id, action: 'unsuspend' })} className="rounded-lg bg-success-600 hover:bg-success-700 px-2.5 py-1 text-xs font-medium text-white transition-colors">Reinstate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-text-muted">No companies found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide panel */}
      {selected && (
        <SlidePanel
          isOpen={!!selectedId}
          onClose={() => setSelectedId(null)}
          title={selected.company_name}
          subtitle={<p className="text-xs text-text-muted">{selected.email}</p>}
          fullPageHref={ROUTES.ADMIN_COMPANY_DETAIL(selected.id)}
        >
          <CompanyPanel
            company={selected}
            onAction={(id, action) => { actionMutation.mutate({ id, action }) }}
          />
        </SlidePanel>
      )}
    </div>
  )
}
