import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, Ban, CheckCircle2, ShieldCheck, Clock, DollarSign, BarChart2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow, format } from 'date-fns'

interface RespondentDetail {
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
  gender?: string
  age_group?: string
  province?: string
}

interface RespondentSurveyHistory {
  id: string
  survey_title: string
  quality: 'high' | 'medium' | 'low'
  reward_status: 'earned' | 'pending' | 'invalidated'
  submitted_at: string
}

interface RespondentFraudAlert {
  id: string
  trigger: string
  severity: 'high' | 'medium' | 'low'
  status: string
  detected_at: string
}

const TRUST_COLORS = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-500']

function TrustDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn('h-3 w-3 rounded-full', i < level ? TRUST_COLORS[level] : 'bg-gray-200')} />
        ))}
      </div>
      <span className="text-sm font-semibold text-text-primary">Level {level}</span>
    </div>
  )
}

export default function AdminRespondentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data: respondent, isLoading } = useQuery<RespondentDetail>({
    queryKey: ['admin', 'respondents', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/respondents/${id}`)
      return data as RespondentDetail
    },
  })

  const { data: history = [] } = useQuery<RespondentSurveyHistory[]>({
    queryKey: ['admin', 'respondents', id, 'history'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/respondents/${id}/history`)
      return data as RespondentSurveyHistory[]
    },
    enabled: !!id,
  })

  const { data: fraudAlerts = [] } = useQuery<RespondentFraudAlert[]>({
    queryKey: ['admin', 'respondents', id, 'fraud'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/respondents/${id}/fraud`)
      return data as RespondentFraudAlert[]
    },
    enabled: !!id,
  })

  const actionMutation = useMutation({
    mutationFn: async (action: 'warn' | 'suspend' | 'unsuspend') => {
      await apiClient.patch(`/admin/respondents/${id}/status`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'respondents', id] }),
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

  if (!respondent) return null

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back + header */}
      <div>
        <Link to={ROUTES.ADMIN_RESPONDENTS} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to respondents
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xl font-bold text-violet-700">
              {respondent.full_name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-text-primary">{respondent.full_name}</h1>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
                  respondent.status === 'active' ? 'bg-success-50 text-success-700 border-success-200' :
                  respondent.status === 'warned' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-600 border-red-200'
                )}>
                  {respondent.status}
                </span>
              </div>
              <p className="text-sm text-text-muted">{respondent.email}</p>
              <div className="mt-1"><TrustDots level={respondent.trust_level} /></div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {respondent.status !== 'warned' && respondent.status !== 'suspended' && (
              <button onClick={() => actionMutation.mutate('warn')}
                className="flex items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-700 transition-colors">
                <AlertTriangle className="h-4 w-4" /> Warn
              </button>
            )}
            {respondent.status !== 'suspended' ? (
              <button onClick={() => actionMutation.mutate('suspend')}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 hover:bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors">
                <Ban className="h-4 w-4" /> Suspend
              </button>
            ) : (
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
          { icon: ShieldCheck, label: 'Trust Level', value: `Level ${respondent.trust_level}`, color: TRUST_COLORS[respondent.trust_level] ?? 'bg-gray-400' },
          { icon: BarChart2, label: 'Surveys Done', value: String(respondent.surveys_completed), color: 'bg-indigo-500' },
          { icon: DollarSign, label: 'Total Earned', value: `₮${respondent.total_earned.toLocaleString()}`, color: 'bg-success-600' },
          { icon: AlertTriangle, label: 'Warnings', value: String(respondent.warning_count), color: respondent.warning_count > 2 ? 'bg-red-500' : 'bg-orange-400' },
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

      {/* Profile + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile info */}
        <div className="rounded-xl border border-border bg-white p-5 space-y-3">
          <h2 className="font-semibold text-text-primary">Profile</h2>
          <div>
            <p className="text-xs text-text-muted mb-1">Profile Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500" style={{ width: `${respondent.profile_score}%` }} />
              </div>
              <span className="text-sm font-semibold text-text-primary">{respondent.profile_score}%</span>
            </div>
          </div>
          {[
            { label: 'Joined', value: format(new Date(respondent.joined_at), 'MMM d, yyyy') },
            { label: 'Gender', value: respondent.gender ?? '—' },
            { label: 'Age Group', value: respondent.age_group ?? '—' },
            { label: 'Province', value: respondent.province ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-text-muted">{label}</span>
              <span className="font-medium text-text-primary">{value}</span>
            </div>
          ))}
        </div>

        {/* Survey history */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-text-primary">Recent Survey Activity</h2>
          </div>
          {history.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-text-muted">No survey history</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Survey</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Quality</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Reward</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-border">
                    <td className="px-5 py-3 text-sm text-text-primary max-w-[200px] truncate">{h.survey_title}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                        h.quality === 'high' ? 'bg-success-50 text-success-700' :
                        h.quality === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600')}>
                        {h.quality}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium capitalize',
                        h.reward_status === 'earned' ? 'text-success-700' :
                        h.reward_status === 'pending' ? 'text-yellow-600' : 'text-red-500')}>
                        {h.reward_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {formatDistanceToNow(new Date(h.submitted_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Fraud alerts */}
      {fraudAlerts.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-red-100 bg-red-50">
            <h2 className="font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Fraud Alerts ({fraudAlerts.length})
            </h2>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Trigger</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Severity</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Detected</th>
              </tr>
            </thead>
            <tbody>
              {fraudAlerts.map((a) => (
                <tr key={a.id} className="border-b border-border">
                  <td className="px-5 py-3">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-text-secondary font-mono">{a.trigger}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
                      a.severity === 'high' ? 'bg-red-100 text-red-700 border-red-200' :
                      a.severity === 'medium' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-yellow-100 text-yellow-700 border-yellow-200')}>
                      {a.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-text-secondary capitalize">{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(a.detected_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
