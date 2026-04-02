import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Banknote, CheckCircle2, XCircle, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { formatDistanceToNow } from 'date-fns'

interface Payout {
  id: string
  respondent_name: string
  respondent_email: string
  amount: number
  gateway: 'qpay' | 'bonum'
  account: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requested_at: string
}

interface PayoutStats {
  total_pending: number
  total_pending_amount: number
  released_today: number
  released_today_amount: number
}

const STATUS_TABS = ['all', 'pending', 'processing', 'completed', 'failed'] as const

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    completed: 'bg-success-50 text-success-700 border-success-200',
    failed: 'bg-red-50 text-red-600 border-red-200',
  }
  return cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', map[status] ?? '')
}

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<typeof STATUS_TABS[number]>('pending')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const { data: payouts = [], isLoading } = useQuery<Payout[]>({
    queryKey: ['admin', 'payouts', filter],
    queryFn: async () => {
      const q = filter === 'all' ? '' : `?status=${filter}`
      const { data } = await apiClient.get(`/admin/payouts${q}`)
      return data as Payout[]
    },
  })

  const { data: stats } = useQuery<PayoutStats>({
    queryKey: ['admin', 'payouts', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/payouts/stats')
      return data as PayoutStats
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: string[]; action: 'approve' | 'reject' }) => {
      await apiClient.post('/admin/payouts/batch', { ids, action })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payouts'] })
      setSelected(new Set())
    },
  })

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === payouts.length) setSelected(new Set())
    else setSelected(new Set(payouts.map((p) => p.id)))
  }

  const filtered = payouts

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Payout Management</h1>
        <p className="text-sm text-text-secondary mt-0.5">Review and release respondent withdrawal requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Clock, label: 'Pending Requests', value: stats?.total_pending ?? '—', color: 'bg-yellow-500' },
          { icon: Banknote, label: 'Pending Amount', value: stats ? `₮${(stats.total_pending_amount / 1000).toFixed(0)}K` : '—', color: 'bg-orange-500' },
          { icon: CheckCircle2, label: 'Released Today', value: stats?.released_today ?? '—', color: 'bg-success-600' },
          { icon: TrendingUp, label: 'Today\'s Volume', value: stats ? `₮${(stats.released_today_amount / 1000).toFixed(0)}K` : '—', color: 'bg-violet-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-white p-5">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-3', s.color)}>
              <s.icon className="h-4.5 w-4.5 text-white" />
            </div>
            <p className="text-xl font-bold text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Batch actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3">
          <span className="text-sm text-violet-700 font-medium">{selected.size} selected</span>
          <button
            onClick={() => actionMutation.mutate({ ids: Array.from(selected), action: 'approve' })}
            className="rounded-lg bg-success-600 hover:bg-success-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
          >
            Approve All
          </button>
          <button
            onClick={() => actionMutation.mutate({ ids: Array.from(selected), action: 'reject' })}
            className="rounded-lg border border-red-200 hover:bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors"
          >
            Reject All
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-violet-500 hover:text-violet-700 ml-auto">
            Clear selection
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors',
              filter === tab ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === payouts.length && payouts.length > 0}
                    onChange={toggleAll} className="h-4 w-4 rounded border-gray-300 text-violet-600" />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Respondent</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Gateway</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Account</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Requested</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={8} className="px-5 py-4"><div className="h-4 rounded bg-gray-100 animate-pulse" /></td>
                </tr>
              ))}
              {!isLoading && filtered.map((p) => (
                <tr key={p.id} className={cn('border-b border-border hover:bg-gray-50 transition-colors', selected.has(p.id) && 'bg-violet-50')}>
                  <td className="px-4 py-4">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)}
                      className="h-4 w-4 rounded border-gray-300 text-violet-600" />
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-medium text-text-primary">{p.respondent_name}</p>
                    <p className="text-xs text-text-muted">{p.respondent_email}</p>
                  </td>
                  <td className="px-4 py-4 text-sm font-bold text-text-primary">₮{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full font-medium text-text-secondary uppercase">
                      {p.gateway}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-text-muted font-mono">{p.account}</td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(p.requested_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-4"><span className={statusBadge(p.status)}>{p.status}</span></td>
                  <td className="px-4 py-4">
                    {p.status === 'pending' && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => actionMutation.mutate({ ids: [p.id], action: 'approve' })}
                          className="rounded bg-success-600 hover:bg-success-700 px-2.5 py-1 text-xs font-medium text-white transition-colors">
                          Approve
                        </button>
                        <button onClick={() => actionMutation.mutate({ ids: [p.id], action: 'reject' })}
                          className="rounded border border-border hover:bg-gray-50 px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-text-muted">No payouts found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
