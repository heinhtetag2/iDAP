import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Edit2, Pause, Play, Trash2, Users, CheckCircle2, Clock, DollarSign, BarChart2, AlertCircle, Timer, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Breadcrumb, SlidePanel } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow, format } from 'date-fns'

interface SurveyDetail {
  id: string
  title: string
  description: string
  category: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  current_responses: number
  max_responses: number
  reward_amount: number
  est_minutes: number
  trust_level_required: number
  is_anonymous: boolean
  created_at: string
  ends_at: string | null
  budget_spent: number
  avg_completion_rate: number
  avg_quality_score: number
  questions_count: number
}

interface RecentResponse {
  id: string
  respondent_name: string
  quality: 'high' | 'medium' | 'low'
  status: 'earned' | 'pending' | 'invalidated'
  submitted_at: string
}

interface QualityFactor {
  name: string
  passed: boolean
  penalty: number
  note: string
}

interface AnswerDetail {
  question_number: number
  question_text: string
  question_type: string
  answer: string | string[]
  time_seconds: number
  flagged: boolean
  flag_reason?: string
}

interface ResponseDetail {
  id: string
  respondent_name: string
  quality_score: number
  multiplier: number
  reward_earned: number
  time_taken_seconds: number
  quality_factors: QualityFactor[]
  answers: AnswerDetail[]
}

function ResponseDetailPanel({ surveyId, responseId }: { surveyId: string; responseId: string }) {
  const [expandedAnswers, setExpandedAnswers] = useState(true)

  const { data, isLoading } = useQuery<ResponseDetail>({
    queryKey: ['company', 'surveys', surveyId, 'responses', responseId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/company/surveys/${surveyId}/responses/${responseId}`)
      return data as ResponseDetail
    },
  })

  if (isLoading) {
    return (
      <div className="p-5 space-y-4 animate-pulse">
        <div className="h-20 bg-gray-100 rounded-xl" />
        <div className="h-32 bg-gray-100 rounded-xl" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  const scoreColor = data.quality_score >= 80 ? 'text-success-700' : data.quality_score >= 60 ? 'text-yellow-600' : 'text-red-600'
  const scoreBarColor = data.quality_score >= 80 ? 'bg-success-500' : data.quality_score >= 60 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="p-5 space-y-5">
      {/* Quality score */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-secondary">Quality Score</span>
          <span className={cn('text-2xl font-bold', scoreColor)}>{data.quality_score}</span>
        </div>
        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', scoreBarColor)} style={{ width: `${data.quality_score}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { icon: Timer, label: 'Time taken', value: `${Math.round(data.time_taken_seconds / 60)}m ${data.time_taken_seconds % 60}s`, color: 'text-indigo-600 bg-indigo-50' },
            { icon: BarChart2, label: 'Multiplier', value: `×${data.multiplier.toFixed(1)}`, color: 'text-violet-600 bg-violet-50' },
            { icon: DollarSign, label: 'Reward', value: `₮${data.reward_earned.toLocaleString()}`, color: 'text-orange-600 bg-orange-50' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="rounded-xl border border-border p-3 text-center">
              <div className={cn('inline-flex h-7 w-7 items-center justify-center rounded-lg mb-1', color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-bold text-text-primary">{value}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quality factors */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Quality Factors</p>
        </div>
        <div className="divide-y divide-border">
          {data.quality_factors.map((factor) => (
            <div key={factor.name} className="flex items-start gap-3 px-4 py-3">
              {factor.passed
                ? <CheckCircle2 className="h-4 w-4 text-success-600 mt-0.5 shrink-0" />
                : <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text-primary">{factor.name}</p>
                  {!factor.passed && factor.penalty > 0 && (
                    <span className="text-xs font-semibold text-red-600 shrink-0">−{factor.penalty} pts</span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-0.5">{factor.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Answers */}
      <div className="rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setExpandedAnswers((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-border hover:bg-gray-100 transition-colors"
        >
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">
            Answers ({data.answers.length} questions)
          </p>
          {expandedAnswers ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
        </button>
        {expandedAnswers && (
          <div className="divide-y divide-border">
            {data.answers.map((a) => (
              <div key={a.question_number} className="px-4 py-3 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700 mt-0.5">
                    {a.question_number}
                  </span>
                  <p className="text-xs font-medium text-text-secondary leading-snug">{a.question_text}</p>
                </div>
                <div className="flex items-start gap-1.5 pl-7">
                  <MessageSquare className="h-3.5 w-3.5 text-text-muted shrink-0 mt-0.5" />
                  <p className="text-sm text-text-primary">
                    {Array.isArray(a.answer) ? a.answer.join(', ') : a.answer}
                  </p>
                </div>
                <div className="flex items-center gap-2 pl-7">
                  <span className={cn('text-[11px]', a.time_seconds < 3 ? 'text-red-500 font-semibold' : 'text-text-muted')}>
                    {a.time_seconds}s
                  </span>
                  {a.flagged && (
                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-semibold uppercase">
                      {a.flag_reason ?? 'flagged'}
                    </span>
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

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-success-50 text-success-700 border-success-200',
  paused: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-gray-100 text-gray-600 border-gray-200',
  draft: 'bg-blue-50 text-blue-600 border-blue-200',
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg mb-3', color)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary mt-0.5">{label}</p>
    </div>
  )
}

export default function CompanySurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedResponseId, setSelectedResponseId] = useState<string | null>(null)

  const { data: survey, isLoading } = useQuery<SurveyDetail>({
    queryKey: ['company', 'surveys', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/company/surveys/${id}`)
      return data as SurveyDetail
    },
  })

  const { data: responses = [] } = useQuery<RecentResponse[]>({
    queryKey: ['company', 'surveys', id, 'responses'],
    queryFn: async () => {
      const { data } = await apiClient.get(`/company/surveys/${id}/responses?limit=8`)
      return data as RecentResponse[]
    },
    enabled: !!id,
  })

  const statusMutation = useMutation({
    mutationFn: async (status: 'paused' | 'active') => {
      await apiClient.patch(`/company/surveys/${id}/status`, { status })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'surveys', id] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/company/surveys/${id}`)
    },
    onSuccess: () => navigate(ROUTES.COMPANY_SURVEYS),
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
  const progressColor = progressPct < 50 ? 'bg-success-500' : progressPct < 80 ? 'bg-yellow-400' : 'bg-red-500'

  return (
    <div className="space-y-6 w-full">
      {/* Back + header */}
      <div>
        <Breadcrumb items={[
          { label: 'Surveys', href: ROUTES.COMPANY_SURVEYS },
          { label: survey.title },
        ]} />
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-text-primary">{survey.title}</h1>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', STATUS_COLOR[survey.status])}>
                {survey.status}
              </span>
            </div>
            <p className="text-sm text-text-secondary capitalize">{survey.category.replace('_', ' ')} · {survey.questions_count} questions · ~{survey.est_minutes} min</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to={ROUTES.COMPANY_SURVEY_EDIT(survey.id)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white hover:bg-gray-50 px-3 py-2 text-sm font-medium text-text-secondary transition-colors">
              <Edit2 className="h-4 w-4" /> Edit
            </Link>
            {survey.status === 'active' && (
              <button onClick={() => statusMutation.mutate('paused')}
                className="flex items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-700 transition-colors">
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}
            {survey.status === 'paused' && (
              <button onClick={() => statusMutation.mutate('active')}
                className="flex items-center gap-1.5 rounded-lg bg-success-600 hover:bg-success-700 px-3 py-2 text-sm font-medium text-white transition-colors">
                <Play className="h-4 w-4" /> Resume
              </button>
            )}
            {survey.status === 'draft' && (
              <button onClick={() => statusMutation.mutate('active')}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-2 text-sm font-medium text-white transition-colors">
                Publish
              </button>
            )}
            <button onClick={() => { if (confirm('Delete this survey?')) deleteMutation.mutate() }}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 hover:bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Responses" value={`${survey.current_responses} / ${survey.max_responses}`} color="bg-indigo-500" />
        <StatCard icon={CheckCircle2} label="Completion Rate" value={`${survey.avg_completion_rate}%`} color="bg-success-600" />
        <StatCard icon={BarChart2} label="Avg Quality" value={`${survey.avg_quality_score}`} color="bg-violet-500" />
        <StatCard icon={DollarSign} label="Budget Spent" value={`₮${(survey.budget_spent / 1000).toFixed(0)}K`} color="bg-orange-500" />
      </div>

      {/* Progress + meta */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5 space-y-4">
          <h2 className="font-semibold text-text-primary">Response Progress</h2>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">{survey.current_responses} collected</span>
              <span className="font-medium text-text-primary">{progressPct}%</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', progressColor)} style={{ width: `${progressPct}%` }} />
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
            { label: 'Reward per response', value: `₮${survey.reward_amount.toLocaleString()}` },
            { label: 'Trust level required', value: `Level ${survey.trust_level_required}+` },
            { label: 'Anonymous', value: survey.is_anonymous ? 'Yes' : 'No' },
            { label: 'Created', value: formatDistanceToNow(new Date(survey.created_at), { addSuffix: true }) },
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
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Recent Responses</h2>
          <p className="text-xs text-text-muted">Click a row to see answers &amp; quality breakdown</p>
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
                  <td className="px-5 py-3 text-sm font-medium text-text-primary">{r.respondent_name}</td>
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

      {selectedResponseId && (
        <SlidePanel
          isOpen={!!selectedResponseId}
          onClose={() => setSelectedResponseId(null)}
          title="Response Detail"
          subtitle={
            <p className="text-xs text-text-muted">
              {responses.find((r) => r.id === selectedResponseId)?.respondent_name}
            </p>
          }
          width="w-[520px]"
        >
          <ResponseDetailPanel surveyId={id!} responseId={selectedResponseId} />
        </SlidePanel>
      )}
    </div>
  )
}
