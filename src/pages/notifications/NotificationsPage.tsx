import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Gift, Bell, FileText, Banknote, CheckCheck } from 'lucide-react'
import { Button, Card, CardContent, Skeleton, EmptyState } from '@/shared/ui'
import { cn, formatRelativeTime, formatDate } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { useNotificationStream } from '@/shared/hooks/useNotificationStream'

interface Notification {
  id: string
  event_type: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await apiClient.get('/notifications')
      return data as Notification[]
    },
    staleTime: 60 * 1000,
  })
}

function useMarkAllRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiClient.put('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

function useMarkRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => apiClient.put(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

const EVENT_ICONS: Record<string, typeof Bell> = {
  reward_granted: Gift,
  reward_pending: Gift,
  survey_invitation: FileText,
  withdrawal_complete: Banknote,
  withdrawal_failed: Banknote,
}

export default function NotificationsPage() {
  const { t } = useTranslation('nav')
  const { data: notifications, isLoading } = useNotifications()
  const markAllRead = useMarkAllRead()
  const markRead = useMarkRead()

  // Start SSE mock stream
  useNotificationStream()

  const hasUnread = notifications?.some((n) => !n.is_read) ?? false

  const grouped = useMemo(() => {
    if (!notifications) return []
    const groups: Record<string, Notification[]> = {}
    for (const n of notifications) {
      const dateKey = formatDate(n.created_at)
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(n)
    }
    return Object.entries(groups)
  }, [notifications])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{t('notifications')}</h1>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            loading={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (!notifications || notifications.length === 0) && (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title="No notifications"
          description="You'll see new notifications here when they arrive"
        />
      )}

      {!isLoading && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-medium text-text-muted mb-3 uppercase tracking-wider">
                {date}
              </p>
              <Card>
                <CardContent className="p-0 divide-y divide-border">
                  {items.map((n) => {
                    const Icon = EVENT_ICONS[n.event_type] ?? Bell
                    return (
                      <button
                        key={n.id}
                        onClick={() => { if (!n.is_read) markRead.mutate(n.id) }}
                        className={cn(
                          'w-full flex items-start gap-3 p-4 transition-colors text-left',
                          !n.is_read ? 'bg-primary-50/50 hover:bg-primary-50' : 'hover:bg-gray-50',
                        )}
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-text-secondary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-text-primary">{n.title}</p>
                            {!n.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-text-secondary mt-0.5">{n.body}</p>
                          <p className="text-xs text-text-muted mt-1">
                            {formatRelativeTime(n.created_at)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
