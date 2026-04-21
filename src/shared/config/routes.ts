export const ROUTES = {
  // ── Public ──────────────────────────────────────────
  PLATFORM_SELECT: '/',

  // ── Respondent ──────────────────────────────────────
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE_SETUP: '/profile-setup',
  FEED: '/feed',
  SURVEY_DETAIL: (id: string) => `/surveys/${id}`,
  SURVEY_PLAYER: (id: string) => `/surveys/${id}/answer`,
  SURVEY_COMPLETE: (id: string) => `/surveys/${id}/complete`,
  WALLET: '/wallet',
  WALLET_HISTORY: '/wallet/history',
  SURVEY_HISTORY: '/surveys/history',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',

  // ── Company (Client) ────────────────────────────────
  COMPANY_LOGIN: '/company/login',
  COMPANY_DASHBOARD: '/company/dashboard',
  COMPANY_SURVEYS: '/company/surveys',
  COMPANY_SURVEY_NEW: '/company/surveys/new',
  COMPANY_SURVEY_DETAIL: (id: string) => `/company/surveys/${id}`,
  COMPANY_SURVEY_EDIT: (id: string) => `/company/surveys/${id}/edit`,
  COMPANY_ANALYTICS: '/company/analytics',
  COMPANY_BILLING: '/company/billing',
  COMPANY_NOTIFICATIONS: '/company/notifications',
  COMPANY_SETTINGS: '/company/settings',

  // ── Admin (Platform Operator) ───────────────────────
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_COMPANIES: '/admin/companies',
  ADMIN_COMPANY_DETAIL: (id: string) => `/admin/companies/${id}`,
  ADMIN_COMPANY_APPROVALS: '/admin/companies/approvals',
  ADMIN_RESPONDENTS: '/admin/respondents',
  ADMIN_RESPONDENT_DETAIL: (id: string) => `/admin/respondents/${id}`,
  ADMIN_RESPONDENT_MODERATION: '/admin/respondents/moderation',
  ADMIN_SURVEYS: '/admin/surveys',
  ADMIN_SURVEY_DETAIL: (id: string) => `/admin/surveys/${id}`,
  ADMIN_PAYOUTS: '/admin/payouts',
  ADMIN_FRAUD: '/admin/fraud',
  ADMIN_FRAUD_DETAIL: (id: string) => `/admin/fraud/${id}`,
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_SETTINGS: '/admin/settings',
} as const
