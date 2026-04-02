import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, Users, CreditCard, TrendingUp, PlusCircle, BarChart2, ArrowUpRight, Clock, CheckCircle2, PauseCircle, Circle } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { useCompanyAuthStore } from '@/shared/model/companyAuthStore'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow } from 'date-fns'

interface DashboardStats {
  active_surveys: number
  total_responses_month: number
  credits_balance: number
  avg_completion_rate: number
  responses_trend: { day: string; count: number }[]
}

interface CompanySurveySummary {
  id: string
  title: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  current_responses: number
  max_responses: number
  reward_amount: number
  created_at: string
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <ArrowUpRight className="h-4 w-4 text-text-muted" />
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      <p className="text-sm text-text-secondary mt-0.5">{label}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
}

function MiniBarChart({ data }: { data: { day: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end gap-1.5 h-16">
      {data.map((d) => (
        <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
          <div
            className="w-full rounded-t bg-indigo-500 transition-all"
            style={{ height: `${Math.max((d.count / max) * 100, 6)}%` }}
          />
        </div>
      ))}
    </div>
  )
}

function statusIcon(status: string) {
  if (status === 'active') return <CheckCircle2 className="h-4 w-4 text-success-600" />
  if (status === 'paused') return <PauseCircle className="h-4 w-4 text-warning-600" />
  if (status === 'completed') return <Circle className="h-4 w-4 text-text-muted" />
  return <Circle className="h-4 w-4 text-text-muted" />
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'bg-success-50 text-success-600',
    paused: 'bg-warning-50 text-warning-600',
    completed: 'bg-gray-100 text-text-muted',
    draft: 'bg-blue-50 text-blue-600',
  }
  return cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', map[status] ?? 'bg-gray-100 text-text-muted')
}

export default function CompanyDashboardPage() {
  const user = useCompanyAuthStore((s) => s.user)

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['company', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/company/dashboard')
      return data as DashboardStats
    },
  })

  const { data: recentSurveys } = useQuery<CompanySurveySummary[]>({
    queryKey: ['company', 'surveys', 'recent'],
    queryFn: async () => {
      const { data } = await apiClient.get('/company/surveys?limit=5')
      return data as CompanySurveySummary[]
    },
  })

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {greeting}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">{user?.company_name} · Dashboard overview</p>
        </div>
        <Link
          to={ROUTES.COMPANY_SURVEY_NEW}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          New Survey
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Active Surveys"
          value={String(stats?.active_surveys ?? '—')}
          sub="Running right now"
          color="bg-indigo-500"
        />
        <StatCard
          icon={Users}
          label="Responses This Month"
          value={stats ? stats.total_responses_month.toLocaleString() : '—'}
          sub="Across all surveys"
          color="bg-success-600"
        />
        <StatCard
          icon={CreditCard}
          label="Credits Balance"
          value={stats ? `₮${stats.credits_balance.toLocaleString()}` : '—'}
          sub={<><Link to={ROUTES.COMPANY_BILLING} className="text-indigo-500 hover:underline">Top up</Link></>}
          color="bg-warning-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg. Completion"
          value={stats ? `${stats.avg_completion_rate}%` : '—'}
          sub="Platform avg: 68%"
          color="bg-primary-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Response trend chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-text-primary">Response Trend</h2>
              <p className="text-xs text-text-muted">Last 7 days</p>
            </div>
            <Link to={ROUTES.COMPANY_ANALYTICS} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              <BarChart2 className="h-3 w-3" />
              Full analytics
            </Link>
          </div>
          {stats?.responses_trend ? (
            <>
              <MiniBarChart data={stats.responses_trend} />
              <div className="flex justify-between mt-2">
                {stats.responses_trend.map((d) => (
                  <span key={d.day} className="text-xs text-text-muted flex-1 text-center">{d.day}</span>
                ))}
              </div>
            </>
          ) : (
            <div className="h-16 rounded-lg bg-gray-50 animate-pulse" />
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold text-text-primary mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {[
              { icon: PlusCircle, label: 'Create new survey', to: ROUTES.COMPANY_SURVEY_NEW, color: 'text-indigo-600' },
              { icon: BarChart2, label: 'View analytics', to: ROUTES.COMPANY_ANALYTICS, color: 'text-success-600' },
              { icon: CreditCard, label: 'Buy credits', to: ROUTES.COMPANY_BILLING, color: 'text-warning-600' },
              { icon: Users, label: 'Browse surveys', to: ROUTES.COMPANY_SURVEYS, color: 'text-primary-600' },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50 transition-colors group"
              >
                <a.icon className={cn('h-5 w-5', a.color)} />
                <span className="text-sm text-text-primary group-hover:text-text-primary font-medium">{a.label}</span>
                <ArrowUpRight className="h-4 w-4 text-text-muted ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent surveys */}
      <div className="rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Recent Surveys</h2>
          <Link to={ROUTES.COMPANY_SURVEYS} className="text-xs text-indigo-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-border">
          {recentSurveys?.map((s) => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="shrink-0">{statusIcon(s.status)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{s.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={statusBadge(s.status)}>{s.status}</span>
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-text-primary">
                  {s.current_responses}/{s.max_responses}
                </p>
                <p className="text-xs text-text-muted">responses</p>
              </div>
              <div className="text-right shrink-0 hidden sm:block">
                <p className="text-sm font-medium text-text-primary">₮{s.reward_amount.toLocaleString()}</p>
                <p className="text-xs text-text-muted">reward</p>
              </div>
            </div>
          ))}
          {!recentSurveys && (
            <div className="px-5 py-8 text-center text-sm text-text-muted">
              No surveys yet —{' '}
              <Link to={ROUTES.COMPANY_SURVEY_NEW} className="text-indigo-600 hover:underline">create your first</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
