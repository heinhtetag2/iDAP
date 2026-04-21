import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, CheckCircle2, Clock, DollarSign, Pause, Play, XCircle,
  Building2, AlertCircle, MessageSquare, Timer, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { Breadcrumb, SlidePanel } from '@/shared/ui'
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
  respondent_id: string
  respondent_name: string
  quality: 'high' | 'medium' | 'low'
  status: 'earned' | 'pending' | 'invalidated'
  submitted_at: string
}

interface ResponseDetail {
  id: string
  respondent_name: string
  quality: 'high' | 'medium' | 'low'
  quality_score: number
  status: 'earned' | 'pending' | 'invalidated'
  submitted_at: string
  time_taken_seconds: number
  reward_base: number
  multiplier: number
  reward_earned: number
  quality_factors: { name: string; passed: boolean; penalty: number; note: string }[]
  answers: {
    question_number: number
    question_text: string
    question_type: string
    answer: string
    time_seconds: number
    flagged: boolean
    flag_reason?: string
  }[]
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-success-50 text-success-700 border-success-200',
  paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  rejected: 'bg-red-50 text-red-600 border-red-200',
}

function ResponseDetailPanel({ surveyId, responseId }: { surveyId: string; responseId: string }) {
  const [showAnswers, setShowAnswers] = useState(true)
  const { data, isLoading } = useQuery<ResponseDetail>({
    queryKey: ['admin', 'surveys', surveyId, 'responses', responseId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/surveys/${surveyId}/responses/${responseId}`)
      return data as ResponseDetail
    },
  })

  if (isLoading) {
    return (
      <div className="p-5 space-y-4 animate-pulse">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 rounded-xl bg-gray-100" />)}
      </div>
    )
  }
  if (!data) return null

  const qualityColor = data.quality === 'high' ? 'text-success-700' : data.quality === 'medium' ? 'text-yellow-700' : 'text-red-600'
  const qualityBg = data.quality === 'high' ? 'bg-success-500' : data.quality === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
  const mins = Math.floor(data.time_taken_seconds / 60)
  const secs = data.time_taken_seconds % 60

  return (
    <div className="p-5 space-y-5">
      {/* Score summary */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">Quality Score</span>
          <span className={cn('text-lg font-black', qualityColor)}>{data.quality_score}<span className="text-sm font-medium text-text-muted">/100</span></span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', qualityBg)} style={{ width: `${data.quality_score}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-xs text-text-muted">Time taken</p>
            <p className="text-sm font-semibold text-text-primary">{mins}m {secs}s</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted">Multiplier</p>
            <p className={cn('text-sm font-semibold', data.multiplier >= 1.1 ? 'text-success-700' : data.multiplier === 1.0 ? 'text-text-primary' : 'text-red-600')}>×{data.multiplier.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted">Reward earned</p>
            <p className="text-sm font-semibold text-text-primary">₮{data.reward_earned.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Quality factor breakdown */}
      <div>
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Quality Breakdown</p>
        <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
          {data.quality_factors.map((f) => (
            <div key={f.name} className={cn('px-4 py-3', !f.passed && 'bg-red-50/50')}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  {f.passed
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-success-600 shrink-0" />
                    : <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                  <span className="text-sm font-medium text-text-primary">{f.name}</span>
                </div>
                {f.penalty !== 0 && (
                  <span className="text-xs font-bold text-red-600">{f.penalty}</span>
                )}
              </div>
              <p className="text-xs text-text-muted pl-5.5">{f.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Answers */}
      <div>
        <button
          onClick={() => setShowAnswers((v) => !v)}
          className="flex items-center justify-between w-full text-xs font-semibold text-text-muted uppercase tracking-wide mb-2"
        >
          <span>Answers ({data.answers.length} questions)</span>
          {showAnswers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showAnswers && (
          <div className="space-y-2">
            {data.answers.map((a) => (
              <div key={a.question_number} className={cn('rounded-xl border p-3.5', a.flagged ? 'border-red-200 bg-red-50/40' : 'border-border bg-white')}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-text-muted">
                      {a.question_number}
                    </span>
                    <p className="text-xs text-text-secondary leading-snug">{a.question_text}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Timer className="h-3 w-3 text-text-muted" />
                    <span className={cn('text-[10px] font-medium', a.time_seconds < 3 ? 'text-red-500' : 'text-text-muted')}>{a.time_seconds}s</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pl-7">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3 text-violet-400" />
                    <span className="text-sm font-medium text-text-primary">{a.answer}</span>
                  </div>
                  {a.flagged && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{a.flag_reason}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminSurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null)

  const fromState = location.state as { from?: string; respondentId?: string; respondentName?: string; companyId?: string; companyName?: string; tab?: string } | null

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
      <div className="space-y-6 w-full animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!survey) return null

  const progressPct = Math.round((survey.current_responses / survey.max_responses) * 100)
  const selectedResponse = responses.find((r) => r.id === selectedResponseId)

  return (
    <div className="space-y-6 w-full">
      {/* Breadcrumb + header */}
      <div>
        <Breadcrumb items={
          fromState?.from === 'respondent'
            ? [
                { label: 'Respondents', href: ROUTES.ADMIN_RESPONDENTS },
                { label: fromState.respondentName ?? 'Respondent', href: ROUTES.ADMIN_RESPONDENT_DETAIL(fromState.respondentId!), state: { from: 'survey', surveyId: id, surveyTitle: survey?.title, tab: 'activity' } },
                { label: survey?.title ?? '…' },
              ]
            : fromState?.from === 'company'
            ? [
                { label: 'Companies', href: ROUTES.ADMIN_COMPANIES },
                { label: fromState.companyName ?? 'Company', href: ROUTES.ADMIN_COMPANY_DETAIL(fromState.companyId!), state: { tab: 'surveys' } },
                { label: survey?.title ?? '…' },
              ]
            : [
                { label: 'Surveys', href: ROUTES.ADMIN_SURVEYS },
                { label: survey?.title ?? '…' },
              ]
        } />
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
              <Link to={ROUTES.ADMIN_COMPANY_DETAIL(survey.company_id)} state={{ tab: 'surveys' }} className="hover:text-violet-600 transition-colors font-medium">
                {survey.company_name}
              </Link>
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
          { icon: Users,       label: 'Responses',        value: `${survey.current_responses} / ${survey.max_responses}`, color: 'bg-indigo-500' },
          { icon: CheckCircle2, label: 'Completion Rate', value: `${survey.avg_completion_rate}%`,                        color: 'bg-success-600' },
          { icon: DollarSign,  label: 'Reward / Response', value: `₮${survey.reward_amount.toLocaleString()}`,           color: 'bg-orange-500' },
          { icon: DollarSign,  label: 'Budget Spent',      value: `₮${(survey.budget_spent / 1000).toFixed(0)}K`,        color: 'bg-violet-500' },
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
            { label: 'Company',        value: survey.company_name },
            { label: 'Trust required', value: `Level ${survey.trust_level_required}+` },
            { label: 'Anonymous',      value: survey.is_anonymous ? 'Yes' : 'No' },
            { label: 'Created',        value: format(new Date(survey.created_at), 'MMM d, yyyy') },
            { label: 'Ends',           value: survey.ends_at ? format(new Date(survey.ends_at), 'MMM d, yyyy') : 'No end date' },
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
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Recent Responses</h2>
          <p className="text-xs text-text-muted">Click a row to see answers & quality breakdown</p>
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
                <tr
                  key={r.id}
                  onClick={() => setSelectedResponseId(r.id)}
                  className={cn('border-b border-border hover:bg-gray-50 transition-colors cursor-pointer', selectedResponseId === r.id && 'bg-violet-50')}
                >
                  <td className="px-5 py-3 text-sm font-medium">
                    <Link
                      to={ROUTES.ADMIN_RESPONDENT_DETAIL(r.respondent_id)}
                      state={{ from: 'survey', surveyId: id, surveyTitle: survey?.title, tab: 'activity' }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-text-primary hover:text-violet-600 transition-colors"
                    >
                      {r.respondent_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                      r.quality === 'high' ? 'bg-success-50 text-success-700' :
                      r.quality === 'medium' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600')}>
                      {r.quality}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('flex items-center gap-1 text-xs font-medium capitalize',
                      r.status === 'earned' ? 'text-success-700' :
                      r.status === 'pending' ? 'text-yellow-600' : 'text-red-500')}>
                      {r.status === 'earned' && <CheckCircle2 className="h-3 w-3" />}
                      {r.status === 'pending' && <Clock className="h-3 w-3" />}
                      {r.status === 'invalidated' && <AlertCircle className="h-3 w-3" />}
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

      {/* Response detail slide panel */}
      {selectedResponse && id && (
        <SlidePanel
          isOpen={!!selectedResponseId}
          onClose={() => setSelectedResponseId(null)}
          title={selectedResponse.respondent_name}
          subtitle={
            <span className="text-xs text-text-muted">
              Submitted {formatDistanceToNow(new Date(selectedResponse.submitted_at), { addSuffix: true })}
            </span>
          }
          width="w-[520px]"
        >
          <ResponseDetailPanel surveyId={id} responseId={selectedResponse.id} />
        </SlidePanel>
      )}
    </div>
  )
}
