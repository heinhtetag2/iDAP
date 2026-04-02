import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { db } from '@/shared/mocks/db'
import { queryKeys } from '@/shared/config/queryKeys'

// Mock SSE via setInterval — simulates real-time notification delivery.
// In production this becomes an EventSource connected to GET /notifications/stream.
const MOCK_EVENTS = [
  {
    event_type: 'reward_granted',
    title: 'Шагнал олгогдлоо',
    title_en: 'Reward Granted',
    title_ko: '보상 지급',
    body: 'Таны хэтэвчинд 3,000₮ нэмэгдлээ',
    body_en: '₮3,000 has been added to your wallet',
    body_ko: '₮3,000이 지갑에 추가되었습니다',
  },
  {
    event_type: 'survey_invitation',
    title: 'Шинэ судалгаа',
    title_en: 'New Survey Available',
    title_ko: '새 설문 이용 가능',
    body: 'Танд тохирох шинэ судалгаа нэмэгдлээ',
    body_en: 'A new survey matching your profile is available',
    body_ko: '프로필에 맞는 새 설문이 등록되었습니다',
  },
]

let notifIdCounter = 10000

export function useNotificationStream() {
  const queryClient = useQueryClient()

  useEffect(() => {
    // Simulate SSE: randomly deliver notifications every ~20s, 25% chance
    const interval = setInterval(() => {
      if (Math.random() > 0.25) return

      const evt = MOCK_EVENTS[Math.floor(Math.random() * MOCK_EVENTS.length)]!
      db.notifications.unshift({
        id: `sse-${++notifIdCounter}`,
        event_type: evt.event_type,
        title: evt.title,
        title_en: evt.title_en,
        title_ko: evt.title_ko,
        body: evt.body,
        body_en: evt.body_en,
        body_ko: evt.body_ko,
        is_read: false,
        created_at: new Date().toISOString(),
      })

      // Invalidate dependent queries per SSE → query invalidation map
      queryClient.invalidateQueries({ queryKey: ['notifications'] })

      if (evt.event_type === 'reward_granted') {
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance })
        queryClient.invalidateQueries({ queryKey: ['surveys', 'feed'] })
      }
    }, 20000)

    return () => clearInterval(interval)
  }, [queryClient])
}

export function useUnreadCount(): number {
  // Derived count — call useNotifications in the component and compute there
  return db.notifications.filter((n) => !n.is_read).length
}
