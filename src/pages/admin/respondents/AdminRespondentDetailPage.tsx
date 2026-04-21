import { useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Ban, CheckCircle2, ShieldCheck, DollarSign, BarChart2, Star, User, ClipboardList, Shield, Info } from 'lucide-react'
import { cn } from '@/shared/lib'
import { formatCurrency } from '@/shared/lib'
import { Tooltip, Breadcrumb } from '@/shared/ui'
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
  avg_quality_score: number
  last_active_at?: string
  status: 'active' | 'warned' | 'suspended'
  joined_at: string
  gender?: string
  age_group?: string
  province?: string
}

interface RespondentSurveyHistory {
  id: string
  survey_id: string
  survey_title: string
  quality: 'high' | 'medium' | 'low'
  quality_score: number
  reward_amount: number
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
const TRUST_LABELS = ['', 'New', 'Verified', 'Trusted', 'Premium', 'Partner']

type Tab = 'profile' | 'activity' | 'fraud'

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'activity', label: 'Survey Activity', icon: ClipboardList },
  { id: 'fraud', label: 'Fraud & Warnings', icon: Shield },
]

function TrustDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn('h-3 w-3 rounded-full', i < level ? TRUST_COLORS[level] : 'bg-gray-200')} />
        ))}
      </div>
      <span className="text-sm font-semibold text-text-primary">Level {level} — {TRUST_LABELS[level]}</span>
    </div>
  )
}

export default function AdminRespondentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Restore tab if coming back from a survey detail page
  const fromState = location.state as { from?: string; surveyId?: string; surveyTitle?: string; tab?: Tab } | null
  const [activeTab, setActiveTab] = useState<Tab>(fromState?.tab ?? 'profile')

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
      <div className="space-y-6 w-full animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!respondent) return null

  return (
    <div className="space-y-6 w-full">
      {/* Back + header */}
      <div>
        <Breadcrumb items={
          fromState?.from === 'survey'
            ? [
                { label: 'Surveys', href: ROUTES.ADMIN_SURVEYS },
                { label: fromState.surveyTitle ?? 'Survey', href: ROUTES.ADMIN_SURVEY_DETAIL(fromState.surveyId!), state: { from: 'respondent', respondentId: id, respondentName: respondent?.full_name, tab: 'activity' } },
                { label: respondent?.full_name ?? '…' },
              ]
            : [
                { label: 'Respondents', href: ROUTES.ADMIN_RESPONDENTS },
                { label: respondent?.full_name ?? '…' },
              ]
        } />
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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { icon: ShieldCheck, label: 'Trust Level', value: `Level ${respondent.trust_level}`, color: TRUST_COLORS[respondent.trust_level] ?? 'bg-gray-400', tooltip: `Level ${respondent.trust_level} — ${TRUST_LABELS[respondent.trust_level]}. Higher levels unlock better-paying surveys.` },
          { icon: BarChart2, label: 'Surveys Done', value: String(respondent.surveys_completed), color: 'bg-indigo-500', tooltip: 'Total number of surveys this respondent has fully completed and submitted.' },
          { icon: DollarSign, label: 'Total Earned', value: formatCurrency(respondent.total_earned), color: 'bg-success-600', tooltip: 'Cumulative rewards paid out to this respondent across all completed surveys.' },
          { icon: Star, label: 'Quality Score', value: `${respondent.avg_quality_score ?? '—'}%`, color: (respondent.avg_quality_score ?? 0) >= 80 ? 'bg-green-500' : (respondent.avg_quality_score ?? 0) >= 65 ? 'bg-yellow-500' : 'bg-red-500', tooltip: `Average quality score across all submissions. Scored on time per question, answer variety, consistency, and completion. ≥80% = ×1.2 bonus, 60–79% = ×1.0 standard, <60% = ×0.5 reduced.` },
          { icon: AlertTriangle, label: 'Warnings', value: String(respondent.warning_count), color: respondent.warning_count > 2 ? 'bg-red-500' : 'bg-orange-400', tooltip: `${respondent.warning_count} warning${respondent.warning_count !== 1 ? 's' : ''} issued. At 3+ warnings the account is eligible for suspension.` },
        ].map(({ icon: Icon, label, value, color, tooltip }) => (
          <Tooltip key={label} content={tooltip} position="bottom">
            <div className="rounded-xl border border-border bg-white p-5 cursor-default w-full">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg mb-3', color)}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-text-primary">{value}</p>
              <p className="text-sm text-text-secondary mt-0.5">{label}</p>
            </div>
          </Tooltip>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const hasBadge = tab.id === 'fraud' && fraudAlerts.length > 0
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
                {hasBadge && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {fraudAlerts.length}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-text-primary">Personal Info</h2>
            <div>
              <p className="text-xs text-text-muted mb-1.5">Profile Setup</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500" style={{ width: `${respondent.profile_score}%` }} />
                </div>
                <span className="text-sm font-semibold text-text-primary">{respondent.profile_score}%</span>
              </div>
            </div>
            {[
              { label: 'Joined', value: format(new Date(respondent.joined_at), 'MMM d, yyyy') },
              { label: 'Last Active', value: respondent.last_active_at ? formatDistanceToNow(new Date(respondent.last_active_at), { addSuffix: true }) : '—' },
              { label: 'Gender', value: respondent.gender ?? '—' },
              { label: 'Age Group', value: respondent.age_group ?? '—' },
              { label: 'Province', value: respondent.province ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm border-t border-border pt-3">
                <span className="text-text-muted">{label}</span>
                <span className="font-medium text-text-primary">{value}</span>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-text-primary">Trust & Quality</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-text-muted mb-1">Trust Level</p>
                <TrustDots level={respondent.trust_level} />
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-text-muted mb-1">Quality Score</p>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className={cn('h-full rounded-full', (respondent.avg_quality_score ?? 0) >= 80 ? 'bg-green-500' : (respondent.avg_quality_score ?? 0) >= 65 ? 'bg-yellow-500' : 'bg-red-500')}
                      style={{ width: `${respondent.avg_quality_score ?? 0}%` }} />
                  </div>
                  <span className="text-sm font-bold text-text-primary">{respondent.avg_quality_score ?? '—'}%</span>
                </div>
                <p className={cn('text-[11px] font-medium',
                  (respondent.avg_quality_score ?? 0) >= 80 ? 'text-green-600' :
                  (respondent.avg_quality_score ?? 0) >= 65 ? 'text-yellow-600' : 'text-red-500')}>
                  {(respondent.avg_quality_score ?? 0) >= 80 ? 'High — ×1.2 reward bonus' :
                   (respondent.avg_quality_score ?? 0) >= 65 ? 'Medium — ×1.0 standard rate' : 'Low — ×0.5 reduced reward'}
                </p>
              </div>
            </div>

            {/* Quality scoring breakdown */}
            <div className="rounded-lg border border-border p-4 space-y-2">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 text-text-muted" />
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">How quality is scored</p>
              </div>
              {[
                { factor: 'Time per question', desc: 'Reading speed — too fast signals skipping without reading' },
                { factor: 'Answer variety', desc: 'Diverse, considered choices vs. repetitive straight-line patterns' },
                { factor: 'Completion', desc: 'All required questions answered without skipping' },
                { factor: 'Consistency', desc: 'Answers align logically across related questions' },
              ].map((f) => (
                <div key={f.factor} className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-text-muted mt-1.5 shrink-0" />
                  <p className="text-xs text-text-secondary">
                    <span className="font-medium text-text-primary">{f.factor}</span> — {f.desc}
                  </p>
                </div>
              ))}
              <div className="pt-2 mt-1 border-t border-border flex items-center gap-3 text-[11px]">
                <span className="text-red-500 font-semibold">×0.5 Low (&lt;60%)</span>
                <span className="text-text-muted">·</span>
                <span className="text-yellow-600 font-semibold">×1.0 Medium (60–79%)</span>
                <span className="text-text-muted">·</span>
                <span className="text-green-600 font-semibold">×1.2 High (≥80%)</span>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 space-y-2">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wide">Account Status</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Current status</span>
                <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
                  respondent.status === 'active' ? 'bg-success-50 text-success-700 border-success-200' :
                  respondent.status === 'warned' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-600 border-red-200')}>
                  {respondent.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">Total warnings</span>
                <span className={cn('text-sm font-bold', respondent.warning_count > 2 ? 'text-red-600' : respondent.warning_count > 0 ? 'text-warning-600' : 'text-text-muted')}>
                  {respondent.warning_count}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Survey Activity</h2>
            <span className="text-xs text-text-muted">{history.length} recent submissions</span>
          </div>
          {history.length === 0 ? (
            <div className="px-5 py-16 text-center text-sm text-text-muted">No survey activity yet</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-border">
                  <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Survey</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Quality Score</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Reward Amount</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 text-sm max-w-[220px] truncate">
                      <Link
                        to={ROUTES.ADMIN_SURVEY_DETAIL(h.survey_id)}
                        state={{ from: 'respondent', respondentId: id, respondentName: respondent?.full_name, tab: 'activity' }}
                        className="text-text-primary hover:text-violet-600 transition-colors"
                      >
                        {h.survey_title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Tooltip content={
                        h.quality === 'high' ? `High quality (${h.quality_score}%) — reward multiplier ×1.2 applied.` :
                        h.quality === 'medium' ? `Medium quality (${h.quality_score}%) — standard rate ×1.0.` :
                        `Low quality (${h.quality_score}%) — reduced multiplier ×0.5. Factors: fast answers, repetitive patterns, or low consistency.`
                      } position="bottom">
                        <div className="flex items-center gap-2 cursor-default">
                          <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className={cn('h-full rounded-full', h.quality === 'high' ? 'bg-green-500' : h.quality === 'medium' ? 'bg-yellow-500' : 'bg-red-500')}
                              style={{ width: `${h.quality_score}%` }} />
                          </div>
                          <span className={cn('text-xs font-semibold',
                            h.quality === 'high' ? 'text-success-700' :
                            h.quality === 'medium' ? 'text-yellow-700' : 'text-red-600')}>
                            {h.quality_score}%
                          </span>
                        </div>
                      </Tooltip>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-sm font-semibold', h.reward_amount > 0 ? 'text-text-primary' : 'text-text-muted')}>
                        {h.reward_amount > 0 ? formatCurrency(h.reward_amount) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                        h.reward_status === 'earned' ? 'bg-success-50 text-success-700' :
                        h.reward_status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600')}>
                        {h.reward_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted whitespace-nowrap">
                      {formatDistanceToNow(new Date(h.submitted_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'fraud' && (
        <div className="space-y-4">
          {fraudAlerts.length === 0 ? (
            <div className="rounded-xl border border-border bg-white px-5 py-16 text-center">
              <Shield className="h-10 w-10 text-success-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-text-primary">No fraud alerts</p>
              <p className="text-xs text-text-muted mt-1">This respondent has a clean record</p>
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h2 className="font-semibold text-red-700">{fraudAlerts.length} Fraud Alert{fraudAlerts.length > 1 ? 's' : ''}</h2>
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
      )}
    </div>
  )
}
