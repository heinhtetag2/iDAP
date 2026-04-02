import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Users, CheckCircle2, Clock, DollarSign, Pause, Play, XCircle, Building2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow, format } from 'date-fns'

interface AdminSurveyDetail {
  id: string
  title: string
  description: string
  category: string
  company_name: string
  company_id: string
  status: 'active' | 'paused' | 'completed' | 'rejected'
  current_responses: number
  max_responses: number
  reward_amount: number
  trust_level_required: number
  is_anonymous: boolean
  est_minutes: number
  questions_count: number
  created_at: string
  ends_at: string | null
  avg_completion_rate: number
  budget_spent: number
}

interface RecentResponse {
  id: string
  respondent_name: string
  quality: 'high' | 'medium' | 'low'
  status: 'earned' | 'pending' | 'invalidated'
  submitted_at: string
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-success-50 text-success-700 border-success-200',
  paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

export default function AdminSurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: survey, isLoading } = useQuery<AdminSurveyDetail>({
    queryKey: ['admin', 'surveys', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/surveys/${id}`)
      return data as AdminSurveyDetail
    },
  })

  const { data: responses = [] } = useQuery<RecentResponse[]>({
    queryKey: ['admin', 'surveys', id, 'responses'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/surveys/${id}/responses?limit=8`)
      return data as RecentResponse[]
    },
    enabled: !!id,
  })

  const moderateMutation = useMutation({
    mutationFn: async (action: 'pause' | 'resume' | 'reject') => {
      await apiClient.patch(`/admin/surveys/${id}/moderate`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'surveys', id] }),
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

  if (!survey) return null

  const progressPct = Math.round((survey.current_responses / survey.max_responses) * 100)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div>
        <Link to={ROUTES.ADMIN_SURVEYS} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to surveys
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-text-primary">{survey.title}</h1>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', STATUS_COLOR[survey.status])}>
                {survey.status}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Building2 className="h-3.5 w-3.5" />
              <span>{survey.company_name}</span>
              <span>·</span>
              <span className="capitalize">{survey.category.replace('_', ' ')}</span>
              <span>·</span>
              <span>{survey.questions_count} questions</span>
              <span>·</span>
              <span>~{survey.est_minutes} min</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {survey.status === 'active' && (
              <button onClick={() => moderateMutation.mutate('pause')}
                className="flex items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-700 transition-colors">
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            {survey.status === 'paused' && (
              <button onClick={() => moderateMutation.mutate('resume')}
                className="flex items-center gap-1.5 rounded-lg bg-success-600 hover:bg-success-700 px-3 py-2 text-sm font-medium text-white transition-colors">
                <Play className="h-4 w-4" /> Resume
              </button>
            )}
            {survey.status !== 'rejected' && survey.status !== 'completed' && (
              <button onClick={() => moderateMutation.mutate('reject')}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 hover:bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors">
                <XCircle className="h-4 w-4" /> Reject
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Responses', value: `${survey.current_responses} / ${survey.max_responses}`, color: 'bg-indigo-500' },
          { icon: CheckCircle2, label: 'Completion Rate', value: `${survey.avg_completion_rate}%`, color: 'bg-success-600' },
          { icon: DollarSign, label: 'Reward / Response', value: `₮${survey.reward_amount.toLocaleString()}`, color: 'bg-orange-500' },
          { icon: DollarSign, label: 'Budget Spent', value: `₮${(survey.budget_spent / 1000).toFixed(0)}K`, color: 'bg-violet-500' },
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

      {/* Progress + details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5 space-y-4">
          <h2 className="font-semibold text-text-primary">Response Progress</h2>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">{survey.current_responses} collected</span>
              <span className="font-medium text-text-primary">{progressPct}%</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-text-muted mt-1">{survey.max_responses - survey.current_responses} spots remaining</p>
          </div>
          {survey.description && (
            <div>
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-text-secondary leading-relaxed">{survey.description}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-white p-5 space-y-3">
          <h2 className="font-semibold text-text-primary">Details</h2>
          {[
            { label: 'Company', value: survey.company_name },
            { label: 'Trust required', value: `Level ${survey.trust_level_required}+` },
            { label: 'Anonymous', value: survey.is_anonymous ? 'Yes' : 'No' },
            { label: 'Created', value: format(new Date(survey.created_at), 'MMM d, yyyy') },
            { label: 'Ends', value: survey.ends_at ? format(new Date(survey.ends_at), 'MMM d, yyyy') : 'No end date' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-text-muted">{label}</span>
              <span className="font-medium text-text-primary">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent responses */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Recent Responses</h2>
        </div>
        {responses.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-text-muted">No responses yet</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Respondent</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Quality</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Reward Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {responses.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-text-primary">{r.respondent_name}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      r.quality === 'high' ? 'bg-success-50 text-success-700' :
                      r.quality === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600')}>
                      {r.quality}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium capitalize',
                      r.status === 'earned' ? 'text-success-700' :
                      r.status === 'pending' ? 'text-yellow-600' : 'text-red-500')}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(r.submitted_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
