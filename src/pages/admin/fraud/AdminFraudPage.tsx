import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Ban, CheckCircle2, Filter } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib'
import { Tooltip, SlidePanel } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow } from 'date-fns'

interface FraudAlert {
  id: string
  respondent_id: string
  respondent_name: string
  survey_id: string
  survey_title: string
  trigger: string
  severity: 'high' | 'medium' | 'low'
  details: string
  status: 'open' | 'investigating' | 'dismissed' | 'banned'
  detected_at: string
}

interface FraudStats {
  open_alerts: number
  banned_today: number
  dismissed_today: number
  high_severity: number
}

const SEVERITY_TABS = ['all', 'high', 'medium', 'low'] as const
const STATUS_TABS = ['open', 'investigating', 'dismissed', 'banned'] as const

const TRIGGER_DESCRIPTIONS: Record<string, string> = {
  speed_click: 'Answered too fast — likely clicking through without reading.',
  duplicate_ip: 'Multiple accounts detected from the same IP address.',
  low_quality: 'Consistently low quality answers across multiple surveys.',
  pattern_match: 'Answer patterns match known fraudulent behavior.',
}

function severityBadge(sev: string) {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-orange-100 text-orange-700 border-orange-200',
    low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  }
  return cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', map[sev] ?? '')
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    open: 'bg-red-50 text-red-600 border-red-200',
    investigating: 'bg-blue-50 text-blue-600 border-blue-200',
    dismissed: 'bg-gray-100 text-gray-600 border-gray-200',
    banned: 'bg-violet-100 text-violet-700 border-violet-200',
  }
  return cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', map[status] ?? '')
}

function FraudPanel({
  alert,
  onAction,
}: {
  alert: FraudAlert
  onAction: (id: string, action: 'investigate' | 'dismiss' | 'ban') => void
}) {
  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={severityBadge(alert.severity)}>{alert.severity} severity</span>
          <span className={statusBadge(alert.status)}>{alert.status}</span>
        </div>
        <p className="text-sm font-mono text-text-secondary bg-gray-50 rounded-lg px-3 py-2 border border-border">
          {alert.trigger}
        </p>
        <p className="text-xs text-text-muted mt-2">
          {TRIGGER_DESCRIPTIONS[alert.trigger] ?? 'Automated system flagged anomalous behavior.'}
        </p>
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border p-4 bg-gray-50">
        <p className="text-xs font-medium text-text-secondary mb-1">Alert details</p>
        <p className="text-sm text-text-primary">{alert.details}</p>
      </div>

      {/* Linked entities */}
      <div className="rounded-xl border border-border divide-y divide-border">
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-text-muted">Respondent</span>
          <Link
            to={ROUTES.ADMIN_RESPONDENT_DETAIL(alert.respondent_id)}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-violet-600 hover:text-violet-700 transition-colors"
          >
            {alert.respondent_name}
          </Link>
        </div>
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-text-muted">Survey</span>
          <Link
            to={ROUTES.ADMIN_SURVEY_DETAIL(alert.survey_id)}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-violet-600 hover:text-violet-700 transition-colors max-w-[180px] truncate text-right"
          >
            {alert.survey_title}
          </Link>
        </div>
        <div className="flex justify-between items-center px-4 py-3 text-sm">
          <span className="text-text-muted">Detected</span>
          <span className="font-medium text-text-primary">
            {formatDistanceToNow(new Date(alert.detected_at), { addSuffix: true })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {alert.status === 'open' && (
          <button
            onClick={() => onAction(alert.id, 'investigate')}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-2 text-sm font-semibold text-white transition-colors"
          >
            Mark as investigating
          </button>
        )}
        {(alert.status === 'open' || alert.status === 'investigating') && (
          <>
            <button
              onClick={() => onAction(alert.id, 'ban')}
              className="w-full rounded-xl bg-red-600 hover:bg-red-700 py-2 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
            >
              <Ban className="h-4 w-4" /> Ban respondent
            </button>
            <button
              onClick={() => onAction(alert.id, 'dismiss')}
              className="w-full rounded-xl border border-border hover:bg-gray-50 py-2 text-sm font-medium text-text-secondary transition-colors"
            >
              Dismiss (false positive)
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default function AdminFraudPage() {
  const queryClient = useQueryClient()
  const [severityFilter, setSeverityFilter] = useState<typeof SEVERITY_TABS[number]>('all')
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_TABS[number]>('open')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: alerts = [], isLoading } = useQuery<FraudAlert[]>({
    queryKey: ['admin', 'fraud', severityFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (severityFilter !== 'all') params.set('severity', severityFilter)
      if (statusFilter) params.set('status', statusFilter)
      const { data } = await apiClient.get(`/admin/fraud?${params}`)
      return data as FraudAlert[]
    },
  })

  const { data: stats } = useQuery<FraudStats>({
    queryKey: ['admin', 'fraud', 'stats'],
    queryFn: async () => {
      const { data } = await apiClient.get('/admin/fraud/stats')
      return data as FraudStats
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'investigate' | 'dismiss' | 'ban' }) => {
      await apiClient.patch(`/admin/fraud/${id}/action`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'fraud'] }),
  })

  const selected = alerts.find((a) => a.id === selectedId) ?? null

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Fraud Queue</h1>
        <p className="text-sm text-text-secondary mt-0.5">Automated fraud detection alerts requiring review</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: AlertTriangle, label: 'Open Alerts',     value: stats?.open_alerts ?? '—',     color: 'bg-red-500',     highlight: true },
          { icon: AlertTriangle, label: 'High Severity',   value: stats?.high_severity ?? '—',   color: 'bg-orange-500',  highlight: false },
          { icon: Ban,           label: 'Banned Today',    value: stats?.banned_today ?? '—',    color: 'bg-violet-600',  highlight: false },
          { icon: CheckCircle2,  label: 'Dismissed Today', value: stats?.dismissed_today ?? '—', color: 'bg-success-600', highlight: false },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl border bg-white p-5', s.highlight && (stats?.open_alerts ?? 0) > 0 ? 'border-red-200 bg-red-50' : 'border-border')}>
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-3', s.color)}>
              <s.icon className="h-4.5 w-4.5 text-white" />
            </div>
            <p className={cn('text-xl font-bold', s.highlight && (stats?.open_alerts ?? 0) > 0 ? 'text-red-600' : 'text-text-primary')}>{s.value}</p>
            <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          <span className="px-2 text-xs text-text-muted flex items-center gap-1"><Filter className="h-3 w-3" /> Status:</span>
          {STATUS_TABS.map((tab) => (
            <button key={tab} onClick={() => setStatusFilter(tab)}
              className={cn('px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                statusFilter === tab ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-border bg-white p-1">
          <span className="px-2 text-xs text-text-muted">Severity:</span>
          {SEVERITY_TABS.map((tab) => (
            <button key={tab} onClick={() => setSeverityFilter(tab)}
              className={cn('px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                severityFilter === tab ? 'bg-violet-600 text-white' : 'text-text-secondary hover:bg-gray-50')}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Respondent</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Survey</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Trigger</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Severity</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Detected</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  <td colSpan={7} className="px-5 py-4"><div className="h-4 rounded bg-gray-100 animate-pulse" /></td>
                </tr>
              ))}
              {!isLoading && alerts.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={cn(
                    'border-b border-border hover:bg-gray-50 transition-colors cursor-pointer',
                    a.severity === 'high' && selectedId !== a.id && 'bg-red-50/30',
                    selectedId === a.id && 'bg-violet-50'
                  )}
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-text-primary">{a.respondent_name}</p>
                    <p className="text-xs text-text-muted">{a.details}</p>
                  </td>
                  <td className="px-4 py-4 text-sm text-text-secondary max-w-[160px] truncate">{a.survey_title}</td>
                  <td className="px-4 py-4">
                    <Tooltip
                      content={TRIGGER_DESCRIPTIONS[a.trigger] ?? 'Automated system flagged anomalous behavior.'}
                      position="bottom"
                    >
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-text-secondary font-mono cursor-default">
                        {a.trigger}
                      </span>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-4">
                    <Tooltip content={
                      a.severity === 'high' ? 'High — immediate action required. Strong evidence of fraud.' :
                      a.severity === 'medium' ? 'Medium — review recommended. Suspicious but not confirmed.' :
                      'Low — minor anomaly. Monitor but likely not fraud.'
                    } position="bottom">
                      <span className={severityBadge(a.severity)}>{a.severity}</span>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-4"><span className={statusBadge(a.status)}>{a.status}</span></td>
                  <td className="px-4 py-4 text-xs text-text-muted">
                    {formatDistanceToNow(new Date(a.detected_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {a.status === 'open' && (
                        <Tooltip content="Mark as under investigation — flags this alert for deeper review." position="bottom">
                          <button onClick={() => actionMutation.mutate({ id: a.id, action: 'investigate' })}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1 text-xs font-medium text-white transition-colors">
                            Investigate
                          </button>
                        </Tooltip>
                      )}
                      {(a.status === 'open' || a.status === 'investigating') && (
                        <>
                          <Tooltip content="Permanently ban this respondent from the platform." position="bottom">
                            <button onClick={() => actionMutation.mutate({ id: a.id, action: 'ban' })}
                              className="rounded-lg bg-red-600 hover:bg-red-700 px-2.5 py-1 text-xs font-medium text-white transition-colors flex items-center gap-1">
                              <Ban className="h-3 w-3" /> Ban
                            </button>
                          </Tooltip>
                          <Tooltip content="Dismiss this alert — mark as a false positive, no action taken." position="bottom">
                            <button onClick={() => actionMutation.mutate({ id: a.id, action: 'dismiss' })}
                              className="rounded-lg border border-border hover:bg-gray-50 px-2.5 py-1 text-xs font-medium text-text-secondary transition-colors">
                              Dismiss
                            </button>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && alerts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <CheckCircle2 className="h-8 w-8 text-success-500 mx-auto mb-2" />
                    <p className="text-sm text-text-muted">No alerts matching this filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <SlidePanel
          isOpen={!!selectedId}
          onClose={() => setSelectedId(null)}
          title={selected.respondent_name}
          subtitle={<span className={severityBadge(selected.severity)}>{selected.severity} severity</span>}
          fullPageHref={ROUTES.ADMIN_FRAUD_DETAIL(selected.id)}
        >
          <FraudPanel
            alert={selected}
            onAction={(id, action) => { actionMutation.mutate({ id, action }) }}
          />
        </SlidePanel>
      )}
    </div>
  )
}
