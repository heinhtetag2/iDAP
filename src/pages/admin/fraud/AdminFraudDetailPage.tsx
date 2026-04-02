import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, Ban, CheckCircle2, Eye, ShieldAlert, User, FileText } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow, format } from 'date-fns'

interface FraudAlertDetail {
  id: string
  respondent_id: string
  respondent_name: string
  respondent_email: string
  respondent_trust_level: number
  survey_id: string
  survey_title: string
  company_name: string
  trigger: string
  severity: 'high' | 'medium' | 'low'
  details: string
  status: 'open' | 'investigating' | 'dismissed' | 'banned'
  detected_at: string
  notes?: string
  ip_address?: string
  device_fingerprint?: string
}

const SEVERITY_COLOR: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200',
  medium: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-red-50 text-red-600 border-red-200',
  investigating: 'bg-blue-50 text-blue-600 border-blue-200',
  dismissed: 'bg-gray-100 text-gray-600 border-gray-200',
  banned: 'bg-violet-100 text-violet-700 border-violet-200',
}

export default function AdminFraudDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: alert, isLoading } = useQuery<FraudAlertDetail>({
    queryKey: ['admin', 'fraud', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/admin/fraud/${id}`)
      return data as FraudAlertDetail
    },
  })

  const actionMutation = useMutation({
    mutationFn: async (action: 'investigate' | 'dismiss' | 'ban') => {
      await apiClient.patch(`/admin/fraud/${id}/action`, { action })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'fraud', id] }),
  })

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-64" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (!alert) return null

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back + header */}
      <div>
        <Link to={ROUTES.ADMIN_FRAUD} className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text-primary mb-3 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to fraud queue
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldAlert className={cn('h-5 w-5', alert.severity === 'high' ? 'text-red-500' : alert.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500')} />
              <h1 className="text-2xl font-bold text-text-primary">Fraud Alert</h1>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', SEVERITY_COLOR[alert.severity])}>
                {alert.severity} severity
              </span>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border capitalize', STATUS_COLOR[alert.status])}>
                {alert.status}
              </span>
            </div>
            <p className="text-sm text-text-muted">Detected {formatDistanceToNow(new Date(alert.detected_at), { addSuffix: true })}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {alert.status === 'open' && (
              <button onClick={() => actionMutation.mutate('investigate')}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-medium text-white transition-colors">
                Investigate
              </button>
            )}
            {(alert.status === 'open' || alert.status === 'investigating') && (
              <>
                <button onClick={() => actionMutation.mutate('ban')}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 px-3 py-2 text-sm font-medium text-white transition-colors">
                  <Ban className="h-4 w-4" /> Ban
                </button>
                <button onClick={() => actionMutation.mutate('dismiss')}
                  className="rounded-lg border border-border hover:bg-gray-50 px-3 py-2 text-sm font-medium text-text-secondary transition-colors">
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Alert info */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-text-muted" /> Detection Details
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            {[
              { label: 'Trigger', value: alert.trigger },
              { label: 'Detected at', value: format(new Date(alert.detected_at), 'MMM d, yyyy HH:mm') },
              { label: 'IP Address', value: alert.ip_address ?? '—' },
              { label: 'Device Fingerprint', value: alert.device_fingerprint ?? '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-medium text-text-primary font-mono">{value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">Details</p>
            <p className="text-sm text-text-secondary leading-relaxed">{alert.details}</p>
            {alert.notes && (
              <div className="mt-3">
                <p className="text-xs text-text-muted mb-1">Investigator Notes</p>
                <p className="text-sm text-text-secondary">{alert.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Respondent */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <User className="h-4 w-4 text-text-muted" /> Flagged Respondent
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-base font-bold text-violet-700">
            {alert.respondent_name.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">{alert.respondent_name}</p>
            <p className="text-xs text-text-muted">{alert.respondent_email}</p>
          </div>
          <Link
            to={ROUTES.ADMIN_RESPONDENT_DETAIL(alert.respondent_id)}
            className="flex items-center gap-1.5 rounded-lg border border-border hover:bg-gray-50 px-3 py-2 text-sm font-medium text-text-secondary transition-colors"
          >
            <Eye className="h-4 w-4" /> View Profile
          </Link>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-muted">Trust Level</span>
          <span className="font-medium text-text-primary">Level {alert.respondent_trust_level}</span>
        </div>
      </div>

      {/* Survey */}
      <div className="rounded-xl border border-border bg-white p-5 space-y-3">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <FileText className="h-4 w-4 text-text-muted" /> Related Survey
        </h2>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">{alert.survey_title}</p>
            <p className="text-xs text-text-muted mt-0.5">{alert.company_name}</p>
          </div>
          <Link
            to={ROUTES.ADMIN_SURVEY_DETAIL(alert.survey_id)}
            className="flex items-center gap-1.5 rounded-lg border border-border hover:bg-gray-50 px-3 py-2 text-sm font-medium text-text-secondary transition-colors shrink-0"
          >
            <Eye className="h-4 w-4" /> View Survey
          </Link>
        </div>
      </div>
    </div>
  )
}
