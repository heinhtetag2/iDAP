import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle2, Ban, Clock, BarChart2, DollarSign, FileText, Building2 } from 'lucide-react'
import { cn } from '@/shared/lib'
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

export default function AdminCompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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

  const actionMutation = useMutation({
    mutationFn: async (action: 'approve' | 'suspend' | 'unsuspend') => {
      await apiClient.patch(`/admin/companies/${id}/status`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'companies', id] }),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!company) return null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div>
        <Link to={ROUTES.ADMIN_COMPANIES} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to companies
        </Link>
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
          { icon: DollarSign, label: 'Total Spent', value: `₮${(company.total_spent / 1000).toFixed(0)}K`, color: 'bg-orange-500' },
          { icon: BarChart2, label: 'Credits Balance', value: `₮${(company.credits_balance / 1000).toFixed(0)}K`, color: 'bg-violet-500' },
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

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-white p-5 space-y-3">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Building2 className="h-4 w-4 text-text-muted" /> Company Info
          </h2>
          {[
            { label: 'Email', value: company.email },
            { label: 'Plan', value: company.plan.charAt(0).toUpperCase() + company.plan.slice(1) },
            { label: 'Status', value: company.status.charAt(0).toUpperCase() + company.status.slice(1) },
            { label: 'Joined', value: format(new Date(company.joined_at), 'MMM d, yyyy') },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-text-muted">{label}</span>
              <span className="font-medium text-text-primary">{value}</span>
            </div>
          ))}
        </div>

        {/* Surveys list */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-text-primary">Surveys ({surveys.length})</h2>
          </div>
          {surveys.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-text-muted">No surveys yet</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Title</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Responses</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Reward</th>
                </tr>
              </thead>
              <tbody>
                {surveys.map((s) => (
                  <tr key={s.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-text-primary max-w-[200px] truncate">{s.title}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', SURVEY_STATUS_COLOR[s.status] ?? 'bg-gray-100 text-gray-600')}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{s.current_responses}/{s.max_responses}</td>
                    <td className="px-4 py-3 text-xs font-medium text-text-primary">₮{s.reward_amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
