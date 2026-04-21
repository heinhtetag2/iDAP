import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCircle2, AlertTriangle, CreditCard, FileText, TrendingUp, Check, Trash2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { formatDistanceToNow } from 'date-fns'

interface CompanyNotification {
  id: string
  type: 'survey_response' | 'low_credits' | 'survey_completed' | 'survey_approved' | 'weekly_report'
  title: string
  message: string
  read: boolean
  created_at: string
}

const TYPE_META: Record<CompanyNotification['type'], { icon: React.ElementType; color: string; bg: string }> = {
  survey_response:  { icon: FileText,      color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  low_credits:      { icon: CreditCard,    color: 'text-orange-600',  bg: 'bg-orange-50' },
  survey_completed: { icon: CheckCircle2,  color: 'text-green-600',   bg: 'bg-green-50' },
  survey_approved:  { icon: TrendingUp,    color: 'text-blue-600',    bg: 'bg-blue-50' },
  weekly_report:    { icon: AlertTriangle, color: 'text-violet-600',  bg: 'bg-violet-50' },
}

export default function CompanyNotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<CompanyNotification[]>({
    queryKey: ['company', 'notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/company/notifications')
      return data as CompanyNotification[]
    },
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => apiClient.patch(`/company/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: async () => apiClient.patch('/company/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'notifications'] }),
  })

  const deleteNotif = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/company/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['company', 'notifications'] }),
  })

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Bell className="h-6 w-6 text-indigo-600" />
            Notifications
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-white hover:bg-gray-50 px-3 py-2 text-sm font-medium text-text-secondary transition-colors"
            >
              <Check className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border">
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              filter === f ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-text-muted hover:text-text-primary'
            )}
          >
            {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4 animate-pulse">
                <div className="h-10 w-10 rounded-lg bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-48" />
                  <div className="h-3 bg-gray-100 rounded w-72" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-text-secondary">No {filter === 'unread' ? 'unread ' : ''}notifications</p>
            <p className="text-xs text-text-muted mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((n) => {
              const meta = TYPE_META[n.type]
              const Icon = meta.icon
              return (
                <div
                  key={n.id}
                  className={cn('flex items-start gap-4 px-5 py-4 transition-colors', !n.read && 'bg-indigo-50/40')}
                >
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
                    <Icon className={cn('h-5 w-5', meta.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', !n.read ? 'text-text-primary' : 'text-text-secondary')}>
                        {n.title}
                        {!n.read && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-indigo-500 align-middle" />}
                      </p>
                      <span className="text-xs text-text-muted shrink-0 mt-0.5">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!n.read && (
                      <button
                        onClick={() => markRead.mutate(n.id)}
                        title="Mark as read"
                        className="p-1.5 rounded hover:bg-white text-text-muted hover:text-indigo-600 transition-colors"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotif.mutate(n.id)}
                      title="Delete"
                      className="p-1.5 rounded hover:bg-white text-text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
