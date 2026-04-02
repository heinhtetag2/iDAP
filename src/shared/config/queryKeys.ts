export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  surveys: {
    feed: (filters?: Record<string, unknown>) => ['surveys', 'feed', filters] as const,
    detail: (id: string) => ['surveys', 'detail', id] as const,
    questions: (id: string) => ['surveys', 'questions', id] as const,
  },
  wallet: {
    balance: ['wallet', 'balance'] as const,
    transactions: (cursor?: string) => ['wallet', 'transactions', cursor] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  common: {
    regions: ['common', 'regions'] as const,
    categories: ['common', 'categories'] as const,
  },
} as const
