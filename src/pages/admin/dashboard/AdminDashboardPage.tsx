import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, Building2, FileText, Banknote, AlertTriangle, TrendingUp, Clock, CheckCircle2, ArrowUpRight } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { useAdminAuthStore } from '@/shared/model/adminAuthStore'

interface PlatformStats {
  total_respondents: number
  active_companies: number
  surveys_this_month: number
  pending_payouts_amount: number
  pending_approvals: number
  fraud_alerts: number
  revenue_7d: { day: string; amount: number }[]
  user_growth_7d: { day: string; count: number }[]
}

interface PendingCompany {
  id: string
  company_name: string
  email: string
  plan: string
  submitted_at: string
}

interface RecentActivity {
  id: string
  type: 'company_registered' | 'fraud_detected' | 'payout_requested' | 'survey_published'
  message: string
  time: string
  severity?: 'high' | 'medium' | 'low'
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  to,
  alert,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  color: string
  to?: string
  alert?: boolean
}) {
  const inner = (
    <div className={cn('rounded-xl border bg-white p-5 transition-shadow', to && 'hover:shadow-md cursor-pointer', alert && 'border-red-200 bg-red-50')}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', color)}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {to && <ArrowUpRight className="h-4 w-4 text-text-muted" />}
      </div>
      <p className={cn('text-2xl font-bold', alert ? 'text-red-600' : 'text-text-primary')}>{value}</p>
      <p className="text-sm text-text-secondary mt-0.5">{label}</p>
      {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

function TinyBarChart({ data, color }: { data: { day: string; count?: number; amount?: number }[]; color: string }) {
  const vals = data.map((d) => d.count ?? d.amount ?? 0)
  const max = Math.max(...vals, 1)
  return (
    <div className="flex items-end gap-1 h-14">
      {data.map((d, i) => {
        const val = d.count ?? d.amount ?? 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={cn('w-full rounded-t transition-all', color)}
              style={{ height: `${Math.max((val / max) * 100, 4)}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function AdminDashboardPage() {
  const user = useAdminAuthStore((s) => s.user)

  const { data: stats } = useQuery<PlatformStats>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/dashboard')
      return data as PlatformStats
    },
  })

  const { data: pendingCompanies = [] } = useQuery<PendingCompany[]>({
    queryKey: ['admin', 'companies', 'pending'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/companies?status=pending&limit=5')
      return data as PendingCompany[]
    },
  })

  const { data: activity = [] } = useQuery<RecentActivity[]>({
    queryKey: ['admin', 'activity'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/activity')
      return data as RecentActivity[]
    },
  })

  const activityIcon = (type: string, sev?: string) => {
    if (type === 'fraud_detected') return <AlertTriangle className={cn('h-4 w-4', sev === 'high' ? 'text-red-500' : 'text-warning-500')} />
    if (type === 'company_registered') return <Building2 className="h-4 w-4 text-indigo-500" />
    if (type === 'payout_requested') return <Banknote className="h-4 w-4 text-success-600" />
    return <FileText className="h-4 w-4 text-primary-600" />
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Platform Overview
        </h1>
        <p className="text-sm text-text-secondary mt-0.5">
          Welcome back, {user?.full_name} · {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alerts row */}
      {(stats?.pending_approvals ?? 0) > 0 || (stats?.fraud_alerts ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-3">
          {(stats?.pending_approvals ?? 0) > 0 && (
            <Link to={ROUTES.ADMIN_COMPANIES}
              className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition-colors">
              <Clock className="h-4 w-4" />
              {stats!.pending_approvals} companies awaiting approval
            </Link>
          )}
          {(stats?.fraud_alerts ?? 0) > 0 && (
            <Link to={ROUTES.ADMIN_FRAUD}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors">
              <AlertTriangle className="h-4 w-4" />
              {stats!.fraud_alerts} fraud alerts need review
            </Link>
          )}
        </div>
      ) : null}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Respondents" value={stats?.total_respondents.toLocaleString() ?? '—'}
          sub="All time" color="bg-primary-600" to={ROUTES.ADMIN_RESPONDENTS} />
        <StatCard icon={Building2} label="Active Companies" value={stats?.active_companies ?? '—'}
          sub="Approved & running" color="bg-indigo-500" to={ROUTES.ADMIN_COMPANIES} />
        <StatCard icon={FileText} label="Surveys This Month" value={stats?.surveys_this_month ?? '—'}
          sub="Published" color="bg-success-600" to={ROUTES.ADMIN_SURVEYS} />
        <StatCard icon={Banknote} label="Pending Payouts" value={stats ? `₮${(stats.pending_payouts_amount / 1000).toFixed(0)}K` : '—'}
          sub="Awaiting release" color="bg-warning-600" to={ROUTES.ADMIN_PAYOUTS} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-text-primary text-sm">Revenue (7 days)</h2>
                <p className="text-xs text-text-muted">Credits purchased by companies</p>
              </div>
              <TrendingUp className="h-4 w-4 text-success-600" />
            </div>
            {stats?.revenue_7d && <TinyBarChart data={stats.revenue_7d.map((d) => ({ day: d.day, amount: d.amount }))} color="bg-success-500" />}
          </div>

          <div className="rounded-xl border border-border bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold text-text-primary text-sm">New Users (7 days)</h2>
                <p className="text-xs text-text-muted">Respondent registrations</p>
              </div>
              <Users className="h-4 w-4 text-primary-600" />
            </div>
            {stats?.user_growth_7d && <TinyBarChart data={stats.user_growth_7d.map((d) => ({ day: d.day, count: d.count }))} color="bg-primary-400" />}
          </div>
        </div>

        {/* Recent activity */}
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold text-text-primary mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activity.slice(0, 8).map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{activityIcon(a.type, a.severity)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-primary leading-relaxed">{a.message}</p>
                  <p className="text-xs text-text-muted mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
            {activity.length === 0 && <p className="text-xs text-text-muted">No recent activity</p>}
          </div>
        </div>
      </div>

      {/* Pending approvals */}
      {pendingCompanies.length > 0 && (
        <div className="rounded-xl border border-border bg-white">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning-600" />
              Pending Company Approvals
            </h2>
            <Link to={ROUTES.ADMIN_COMPANIES} className="text-xs text-violet-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {pendingCompanies.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                  {c.company_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{c.company_name}</p>
                  <p className="text-xs text-text-muted">{c.email}</p>
                </div>
                <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">{c.plan}</span>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-success-600 hover:bg-success-700 px-3 py-1.5 text-xs font-medium text-white transition-colors">
                    Approve
                  </button>
                  <button className="rounded-lg border border-border hover:bg-gray-50 px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
