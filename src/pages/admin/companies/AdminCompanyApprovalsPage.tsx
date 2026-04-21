import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Clock, Building2, Mail, Globe, Calendar, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow } from 'date-fns'

interface PendingCompany {
  id: string
  company_name: string
  email: string
  status: 'pending' | 'approved' | 'suspended'
  plan: 'starter' | 'growth' | 'enterprise'
  surveys_count: number
  total_spent: number
  joined_at: string
  industry?: string
  website?: string
  contact_phone?: string
  description?: string
}

type ActionFilter = 'pending' | 'approved' | 'suspended'

const FILTER_TABS: { key: ActionFilter; label: string }[] = [
  { key: 'pending', label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'suspended', label: 'Suspended' },
]

function planBadge(plan: string) {
  const cls =
    plan === 'enterprise'
      ? 'bg-yellow-100 text-yellow-700'
      : plan === 'growth'
      ? 'bg-indigo-100 text-indigo-700'
      : 'bg-gray-100 text-gray-600'
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', cls)}>
      {plan}
    </span>
  )
}

export default function AdminCompanyApprovalsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<ActionFilter>('pending')
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: companies = [], isLoading } = useQuery<PendingCompany[]>({
    queryKey: ['admin', 'companies'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/companies')
      return data as PendingCompany[]
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'suspend' | 'unsuspend' }) => {
      await apiClient.patch(`/admin/companies/${id}/status`, { action })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] })
      setRejectId(null)
      setRejectReason('')
    },
  })

  const filtered = companies.filter((c) => c.status === filter)
  const counts = {
    pending: companies.filter((c) => c.status === 'pending').length,
    approved: companies.filter((c) => c.status === 'approved').length,
    suspended: companies.filter((c) => c.status === 'suspended').length,
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Company Approvals</h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Review and action company account requests
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {([
          { label: 'Pending Review', count: counts.pending, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
          { label: 'Approved', count: counts.approved, color: 'text-success-600 bg-success-50 border-success-200' },
          { label: 'Suspended', count: counts.suspended, color: 'text-red-600 bg-red-50 border-red-200' },
        ] as const).map((s) => (
          <div key={s.label} className={cn('rounded-xl border p-4', s.color)}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex rounded-lg border border-border bg-white p-1 gap-0.5 w-fit">
        {FILTER_TABS.map((tab) => (
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

      {/* Company cards */}
      <div className="space-y-3">
        {isLoading && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5 animate-pulse">
            <div className="h-5 w-48 bg-gray-100 rounded mb-3" />
            <div className="h-4 w-64 bg-gray-100 rounded" />
          </div>
        ))}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-xl border border-border bg-white p-12 text-center">
            <CheckCircle2 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-text-secondary">No {filter} companies</p>
            <p className="text-xs text-text-muted mt-1">All caught up in this category</p>
          </div>
        )}

        {!isLoading && filtered.map((company) => (
          <div key={company.id} className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-base font-bold text-indigo-700">
                {company.company_name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={ROUTES.ADMIN_COMPANY_DETAIL(company.id)}
                        className="text-sm font-semibold text-text-primary hover:text-violet-600 transition-colors flex items-center gap-1"
                      >
                        {company.company_name}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                      {planBadge(company.plan)}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Mail className="h-3 w-3" /> {company.email}
                      </span>
                      {company.website && (
                        <span className="flex items-center gap-1 text-xs text-text-muted">
                          <Globe className="h-3 w-3" /> {company.website}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Calendar className="h-3 w-3" />
                        Applied {formatDistanceToNow(new Date(company.joined_at), { addSuffix: true })}
                      </span>
                    </div>
                    {company.description && (
                      <p className="text-xs text-text-secondary mt-2 max-w-lg line-clamp-2">
                        {company.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {company.status === 'pending' && (
                      <>
                        <button
                          onClick={() => actionMutation.mutate({ id: company.id, action: 'approve' })}
                          disabled={actionMutation.isPending}
                          className="flex items-center gap-1.5 rounded-lg bg-success-600 hover:bg-success-700 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectId(company.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Reject
                        </button>
                      </>
                    )}
                    {company.status === 'approved' && (
                      <button
                        onClick={() => actionMutation.mutate({ id: company.id, action: 'suspend' })}
                        disabled={actionMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors"
                      >
                        Suspend
                      </button>
                    )}
                    {company.status === 'suspended' && (
                      <button
                        onClick={() => actionMutation.mutate({ id: company.id, action: 'unsuspend' })}
                        disabled={actionMutation.isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-success-600 hover:bg-success-700 disabled:opacity-60 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reinstate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reject reason inline */}
            {rejectId === company.id && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Rejection Reason</p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="Optional: explain why this application is being rejected…"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => actionMutation.mutate({ id: company.id, action: 'suspend' })}
                    disabled={actionMutation.isPending}
                    className="rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-60 px-4 py-1.5 text-xs font-semibold text-white transition-colors"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => { setRejectId(null); setRejectReason('') }}
                    className="rounded-lg border border-border hover:bg-gray-50 px-4 py-1.5 text-xs font-medium text-text-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
