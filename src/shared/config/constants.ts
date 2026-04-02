export const MIN_WITHDRAWAL_AMOUNT = 10_000
export const MAX_REWARD_PER_SURVEY = 100_000
export const QUALITY_THRESHOLD = {
  INSTANT: 80,
  HOLD: 50,
  INVALID: 20,
} as const

export const TRUST_LEVELS = {
  1: { label: 'New', access: 'free_only' },
  2: { label: 'Verified', access: 'low_reward' },
  3: { label: 'Trusted', access: 'all' },
  4: { label: 'Excellent', access: 'priority' },
  5: { label: 'Partner', access: 'vip' },
} as const

export const LANGUAGES = [
  { code: 'mn', label: 'Монгол', flag: '\u{1F1F2}\u{1F1F3}' },
  { code: 'en', label: 'English', flag: '\u{1F1EC}\u{1F1E7}' },
  { code: 'ko', label: '\uD55C\uAD6D\uC5B4', flag: '\u{1F1F0}\u{1F1F7}' },
] as const

export const SURVEY_CATEGORIES = [
  'market_research',
  'brand',
  'product',
  'hr',
  'social',
  'other',
] as const

export const QUICK_WITHDRAWAL_AMOUNTS = [10_000, 15_000, 20_000] as const
