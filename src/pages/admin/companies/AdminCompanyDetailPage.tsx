import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Ban, Clock, BarChart2, DollarSign, FileText, Building2, CreditCard, TrendingUp } from 'lucide-react'
import { cn } from '@/shared/lib'
import { formatCurrency } from '@/shared/lib'
import { Breadcrumb } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow, format } from 'date-fns'

interface CompanyDetail {
  id: string
  company_name: string
  email: string
  status: 'pending' | 'approved' | 'suspended'
  plan: 'starter' | 'growth' | 'enterprise'
  surveys_count: number
  total_spent: number
  joined_at: string
  contact_name?: string
  phone?: string
  credits_balance: number
}

interface CompanySurveyItem {
  id: string
  title: string
  status: string
  current_responses: number
  max_responses: number
  reward_amount: number
  created_at: string
}

interface BillingData {
  credits_balance: number
  total_spent: number
  transactions: {
    id: string
    type: 'credit_purchase' | 'survey_spend' | 'refund'
    amount: number
    description: string
    created_at: string
  }[]
}

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-success-50 text-success-700 border-success-200',
  suspended: 'bg-red-50 text-red-600 border-red-200',
}

const PLAN_COLOR: Record<string, string> = {
  enterprise: 'bg-yellow-100 text-yellow-700',
  growth: 'bg-indigo-100 text-indigo-700',
  starter: 'bg-gray-100 text-gray-600',
}

const SURVEY_STATUS_COLOR: Record<string, string> = {
  active: 'bg-success-50 text-success-700',
  paused: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-gray-100 text-gray-600',
  draft: 'bg-blue-50 text-blue-600',
  rejected: 'bg-red-50 text-red-600',
}

type Tab = 'overview' | 'surveys' | 'billing'

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'surveys', label: 'Surveys', icon: FileText },
  { id: 'billing', label: 'Billing & Credits', icon: CreditCard },
]

export default function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const queryClient = useQueryClient()
  const fromState = location.state as { tab?: Tab } | null
  const [activeTab, setActiveTab] = useState<Tab>(fromState?.tab ?? 'overview')

  const { data: company, isLoading } = useQuery<CompanyDetail>({
    queryKey: ['admin', 'companies', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/companies/${id}`)
      return data as CompanyDetail
    },
  })

  const { data: surveys = [] } = useQuery<CompanySurveyItem[]>({
    queryKey: ['admin', 'companies', id, 'surveys'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/companies/${id}/surveys`)
      return data as CompanySurveyItem[]
    },
    enabled: !!id,
  })

  const { data: billing } = useQuery<BillingData>({
    queryKey: ['admin', 'companies', id, 'billing'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/companies/${id}/billing`)
      return data as BillingData
    },
    enabled: !!id && activeTab === 'billing',
  })

  const actionMutation = useMutation({
    mutationFn: async (action: 'approve' | 'suspend' | 'unsuspend') => {
      await apiClient.patch(`/admin/companies/${id}/status`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'companies', id] }),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 w-full animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!company) return null

  return (
    <div className="space-y-6 w-full">
      {/* Back + header */}
      <div>
        <Breadcrumb items={[
          { label: 'Companies', href: ROUTES.ADMIN_COMPANIES },
          { label: company.company_name },
        ]} />
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-xl font-bold text-indigo-700">
              {company.company_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-text-primary">{company.company_name}</h1>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', STATUS_COLOR[company.status])}>
                  {company.status}
                </span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', PLAN_COLOR[company.plan])}>
                  {company.plan}
                </span>
              </div>
              <p className="text-sm text-text-muted">{company.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {company.status === 'pending' && (
              <button onClick={() => actionMutation.mutate('approve')}
                className="flex items-center gap-1.5 rounded-lg bg-success-600 hover:bg-success-700 px-3 py-2 text-sm font-medium text-white transition-colors">
                <CheckCircle2 className="h-4 w-4" /> Approve
              </button>
            )}
            {company.status === 'approved' && (
              <button onClick={() => actionMutation.mutate('suspend')}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 hover:bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors">
                <Ban className="h-4 w-4" /> Suspend
              </button>
            )}
            {company.status === 'suspended' && (
              <button onClick={() => actionMutation.mutate('unsuspend')}
                className="flex items-center gap-1.5 rounded-lg bg-success-600 hover:bg-success-700 px-3 py-2 text-sm font-medium text-white transition-colors">
                <CheckCircle2 className="h-4 w-4" /> Reinstate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: FileText, label: 'Total Surveys', value: String(company.surveys_count), color: 'bg-indigo-500' },
          { icon: DollarSign, label: 'Total Spent', value: formatCurrency(company.total_spent), color: 'bg-orange-500' },
          { icon: BarChart2, label: 'Credits Balance', value: formatCurrency(company.credits_balance), color: 'bg-violet-500' },
          { icon: Clock, label: 'Member Since', value: formatDistanceToNow(new Date(company.joined_at)), color: 'bg-success-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-white p-5">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg mb-3', color)}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-sm text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-700'
                    : 'border-transparent text-text-muted hover:text-text-primary hover:border-gray-300'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.id === 'surveys' && surveys.length > 0 && (
                  <span className="flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-text-muted">
                    {surveys.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Building2 className="h-4 w-4 text-text-muted" /> Company Info
            </h2>
            {[
              { label: 'Email', value: company.email },
              { label: 'Plan', value: company.plan.charAt(0).toUpperCase() + company.plan.slice(1) },
              { label: 'Status', value: company.status.charAt(0).toUpperCase() + company.status.slice(1) },
              { label: 'Joined', value: format(new Date(company.joined_at), 'MMM d, yyyy') },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm border-t border-border pt-3">
                <span className="text-text-muted">{label}</span>
                <span className="font-medium text-text-primary">{value}</span>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-text-muted" /> Activity Summary
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-text-muted mb-1">Active surveys</p>
                <p className="text-2xl font-bold text-text-primary">
                  {surveys.filter(s => s.status === 'active').length}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-text-muted mb-1">Total responses collected</p>
                <p className="text-2xl font-bold text-text-primary">
                  {surveys.reduce((sum, s) => sum + s.current_responses, 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-text-muted mb-1">Credits balance</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(company.credits_balance)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-text-muted mb-1">Total spent</p>
                <p className="text-2xl font-bold text-text-primary">{formatCurrency(company.total_spent)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Surveys */}
      {activeTab === 'surveys' && (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">All Surveys</h2>
            <span className="text-xs text-text-muted">{surveys.length} surveys</span>
          </div>
          {surveys.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-text-muted">No surveys created yet</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Responses</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Reward / resp</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Created</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium max-w-[240px] truncate">
                      <Link
                        to={ROUTES.ADMIN_SURVEY_DETAIL(s.id)}
                        state={{ from: 'company', companyId: id, companyName: company.company_name, tab: 'surveys' }}
                        className="text-text-primary hover:text-violet-600 transition-colors"
                      >
                        {s.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', SURVEY_STATUS_COLOR[s.status] ?? 'bg-gray-100 text-gray-600')}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.min((s.current_responses / s.max_responses) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-text-muted">{s.current_responses}/{s.max_responses}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-text-primary">
                      {s.reward_amount > 0 ? formatCurrency(s.reward_amount) : <span className="text-text-muted">Free</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-white p-5">
              <p className="text-xs text-text-muted mb-1">Current Credits Balance</p>
              <p className="text-3xl font-bold text-violet-700">{formatCurrency(billing?.credits_balance ?? company.credits_balance)}</p>
              <p className="text-xs text-text-muted mt-1">Available to spend on surveys</p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <p className="text-xs text-text-muted mb-1">Total Spent (all time)</p>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(billing?.total_spent ?? company.total_spent)}</p>
              <p className="text-xs text-text-muted mt-1">Across all surveys and rewards</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Transaction History</h2>
            </div>
            {!billing ? (
              <div className="px-5 py-8 text-center text-sm text-text-muted">Loading…</div>
            ) : billing.transactions.length === 0 ? (
              <div className="px-5 py-16 text-center text-sm text-text-muted">No transactions yet</div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-border">
                    <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Type</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-text-primary">{tx.description}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                          tx.type === 'credit_purchase' ? 'bg-green-50 text-green-700' :
                          tx.type === 'refund' ? 'bg-blue-50 text-blue-700' :
                          'bg-orange-50 text-orange-700')}>
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-sm font-semibold',
                          tx.type === 'credit_purchase' || tx.type === 'refund' ? 'text-success-700' : 'text-red-600')}>
                          {tx.type === 'credit_purchase' || tx.type === 'refund' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
