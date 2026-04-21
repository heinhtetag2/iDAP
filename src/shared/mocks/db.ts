import type { AuthUser } from '@/shared/model/authStore'
import type { CompanyUser } from '@/shared/model/companyAuthStore'
import type { AdminUser } from '@/shared/model/adminAuthStore'

// ── Types ────────────────────────────────────────────

export interface MockSurvey {
  id: string
  company_id: string
  title: string
  title_en: string
  title_ko: string
  description: string
  description_en: string
  description_ko: string
  category: string
  status: string
  reward_amount: number
  max_responses: number
  current_responses: number
  estimated_minutes: number
  starts_at: string
  ends_at: string
  is_anonymous: boolean
  company: { name: string; name_en: string; logo_url: string }
  match_score: number
  trust_level_required: number
  questions: MockQuestion[]
  created_at: string
}

export interface MockQuestion {
  id: string
  survey_id: string
  order_index: number
  type: string
  title: string
  title_en: string
  title_ko: string
  description?: string
  is_required: boolean
  options?: { id: string; label: string; label_en: string; label_ko: string }[]
  rows?: { id: string; label: string; label_en: string; label_ko: string }[]
  min_response_ms: number
}

export interface MockTransaction {
  id: string
  type: 'earned' | 'pending' | 'released' | 'withdrawn' | 'refunded' | 'deducted'
  amount: number
  balance_after: number
  note: string
  note_en: string
  note_ko: string
  created_at: string
}

export interface MockSurveyHistoryItem {
  id: string
  survey_id: string
  survey_title: string
  survey_title_en: string
  survey_title_ko: string
  status: 'completed' | 'pending_review' | 'invalidated'
  reward_amount: number
  reward_status: 'granted' | 'pending' | 'invalidated'
  completed_at: string
}

export interface MockWithdrawal {
  id: string
  status: 'pending' | 'completed' | 'failed'
  amount: number
  created_at: number
}

export interface MockNotification {
  id: string
  event_type: string
  title: string
  title_en: string
  title_ko: string
  body: string
  body_en: string
  body_ko: string
  is_read: boolean
  created_at: string
  data?: Record<string, string>
}

// ── ID Generator ─────────────────────────────────────

let idCounter = 0
function uid(): string {
  return `mock-${++idCounter}`
}

// ── Mongolian Names & Data ───────────────────────────

const MN_FIRST = ['Бат', 'Болд', 'Ганболд', 'Отгон', 'Сарантуяа', 'Энхтуяа', 'Мөнхбат', 'Оюунчимэг', 'Тэмүүлэн', 'Нарантуяа']
const MN_LAST = ['Доржийн', 'Баатарын', 'Сүхийн', 'Мөнхийн', 'Ганзоригийн', 'Болдын', 'Цэрэнийн', 'Баярын']
const COMPANIES = [
  { name: 'MCS Group', name_en: 'MCS Group', logo: 'https://ui-avatars.com/api/?name=MCS&background=3b82f6&color=fff' },
  { name: 'Монголын Телеком', name_en: 'Mongolia Telecom', logo: 'https://ui-avatars.com/api/?name=MT&background=16a34a&color=fff' },
  { name: 'Хаан Банк', name_en: 'Khan Bank', logo: 'https://ui-avatars.com/api/?name=KB&background=d97706&color=fff' },
  { name: 'Голомт Банк', name_en: 'Golomt Bank', logo: 'https://ui-avatars.com/api/?name=GB&background=dc2626&color=fff' },
  { name: 'APU Company', name_en: 'APU Company', logo: 'https://ui-avatars.com/api/?name=APU&background=7c3aed&color=fff' },
  { name: 'Tenger Insurance', name_en: 'Tenger Insurance', logo: 'https://ui-avatars.com/api/?name=TI&background=0891b2&color=fff' },
]
const SURVEY_TITLES: { mn: string; en: string; ko: string }[] = [
  { mn: 'Хэрэглэгчийн сэтгэл ханамжийн судалгаа', en: 'Customer Satisfaction Survey', ko: '고객 만족도 설문조사' },
  { mn: 'Брэнд танилцуулгын судалгаа', en: 'Brand Awareness Survey', ko: '브랜드 인지도 설문조사' },
  { mn: 'Шинэ бүтээгдэхүүний санал асуулга', en: 'New Product Feedback Survey', ko: '신제품 피드백 설문조사' },
  { mn: 'Ажиллагсдын сэтгэл ханамж', en: 'Employee Satisfaction Survey', ko: '직원 만족도 설문조사' },
  { mn: 'Нийгмийн хариуцлагын судалгаа', en: 'Social Responsibility Survey', ko: '사회적 책임 설문조사' },
  { mn: 'Зах зээлийн чиг хандлагын судалгаа', en: 'Market Trends Research', ko: '시장 동향 조사' },
  { mn: 'Үйлчилгээний чанарын үнэлгээ', en: 'Service Quality Assessment', ko: '서비스 품질 평가' },
  { mn: 'Хэрэглэгчийн зан төлөвийн судалгаа', en: 'Consumer Behavior Study', ko: '소비자 행동 연구' },
  { mn: 'Байгууллагын соёлын судалгаа', en: 'Organizational Culture Survey', ko: '조직 문화 설문조사' },
  { mn: 'Дижитал шилжилтийн судалгаа', en: 'Digital Transformation Survey', ko: '디지털 전환 설문조사' },
]
const CATEGORIES = ['market_research', 'brand', 'product', 'hr', 'social', 'other'] as const
const Q_TYPES = ['single_choice', 'multi_choice', 'text', 'rating', 'scale', 'ranking', 'matrix', 'date'] as const

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}
function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Factories ────────────────────────────────────────

const Q_TITLE_MAP: Record<string, { mn: string; en: string; ko: string }> = {
  text: { mn: 'Та ямар санал дурдахыг хүсэж байна вэ?', en: 'What feedback would you like to share?', ko: '어떤 의견을 공유하고 싶으신가요?' },
  rating: { mn: 'Үнэлгээ өгнө үү (1-5)', en: 'Please rate (1-5)', ko: '평가해 주세요 (1-5)' },
  ranking: { mn: 'Дараах зүйлсийг чухалчлалын дарааллаар эрэмблэнэ үү', en: 'Rank the following items by importance', ko: '다음 항목을 중요도 순으로 순위를 매겨주세요' },
  matrix: { mn: 'Дараах мэдэгдэл бүрийг үнэлнэ үү', en: 'Please rate each of the following statements', ko: '다음 각 항목을 평가해 주세요' },
  date: { mn: 'Огноо сонгоно уу', en: 'Please select a date', ko: '날짜를 선택해 주세요' },
  default: { mn: 'Дараах сонголтуудаас сонгоно уу', en: 'Please select from the options below', ko: '아래 옵션에서 선택해 주세요' },
}

const MATRIX_COLUMNS = [
  { id: 'strongly_agree', label: 'Маш их зөвшөөрч байна', label_en: 'Strongly Agree', label_ko: '매우 동의' },
  { id: 'agree', label: 'Зөвшөөрч байна', label_en: 'Agree', label_ko: '동의' },
  { id: 'neutral', label: 'Тэнцвэртэй', label_en: 'Neutral', label_ko: '보통' },
  { id: 'disagree', label: 'Зөвшөөрөхгүй', label_en: 'Disagree', label_ko: '반대' },
  { id: 'strongly_disagree', label: 'Огт зөвшөөрөхгүй', label_en: 'Strongly Disagree', label_ko: '매우 반대' },
]

const MATRIX_ROWS = [
  { id: 'r1', label: 'Бүтээгдэхүүний чанар сайн', label_en: 'Product quality is good', label_ko: '제품 품질이 좋다' },
  { id: 'r2', label: 'Үнэ нь зохих хэмжээний', label_en: 'Price is reasonable', label_ko: '가격이 합리적이다' },
  { id: 'r3', label: 'Үйлчилгээ хурдан', label_en: 'Service is fast', label_ko: '서비스가 빠르다' },
  { id: 'r4', label: 'Ажилтнууд найрсаг', label_en: 'Staff are friendly', label_ko: '직원들이 친절하다' },
]

const RANKING_OPTIONS = [
  { id: 'opt_a', label: 'Үнэ / Хямд байдал', label_en: 'Price / Affordability', label_ko: '가격 / 저렴함' },
  { id: 'opt_b', label: 'Чанар', label_en: 'Quality', label_ko: '품질' },
  { id: 'opt_c', label: 'Хурд / Ая тухтай байдал', label_en: 'Speed / Convenience', label_ko: '속도 / 편의성' },
  { id: 'opt_d', label: 'Брэнд нэр хүнд', label_en: 'Brand reputation', label_ko: '브랜드 명성' },
  { id: 'opt_e', label: 'Үйлчилгээ', label_en: 'Customer service', label_ko: '고객 서비스' },
]

function createQuestions(surveyId: string, count: number): MockQuestion[] {
  return Array.from({ length: count }, (_, i) => {
    const type = pick(Q_TYPES)
    const qText = Q_TITLE_MAP[type] ?? Q_TITLE_MAP.default

    let options: MockQuestion['options'] = undefined
    let rows: MockQuestion['rows'] = undefined

    if (type === 'single_choice' || type === 'multi_choice') {
      options = Array.from({ length: rand(3, 6) }, (_, j) => ({
        id: String.fromCharCode(97 + j),
        label: `Сонголт ${j + 1}`,
        label_en: `Option ${j + 1}`,
        label_ko: `선택지 ${j + 1}`,
      }))
    } else if (type === 'ranking') {
      options = [...RANKING_OPTIONS].sort(() => Math.random() - 0.5).slice(0, rand(3, 5))
    } else if (type === 'matrix') {
      options = MATRIX_COLUMNS
      rows = MATRIX_ROWS.slice(0, rand(3, 4))
    }

    return {
      id: uid(),
      survey_id: surveyId,
      order_index: i + 1,
      type,
      title: `Асуулт ${i + 1}: ${qText.mn}`,
      title_en: `Question ${i + 1}: ${qText.en}`,
      title_ko: `질문 ${i + 1}: ${qText.ko}`,
      is_required: true,
      options,
      rows,
      min_response_ms: 2000,
    }
  })
}

function createSurvey(): MockSurvey {
  const id = uid()
  const company = pick(COMPANIES)
  const maxResp = rand(50, 500)
  const currentResp = rand(0, maxResp - 5)
  const reward = pick([0, 1000, 2000, 3000, 5000, 10000, 15000, 20000])
  const qCount = rand(5, 15)
  const now = new Date()
  const endsAt = new Date(now.getTime() + rand(1, 30) * 86400000)

  const titleSet = pick(SURVEY_TITLES)

  return {
    id,
    company_id: uid(),
    title: titleSet.mn,
    title_en: titleSet.en,
    title_ko: titleSet.ko,
    description: 'Энэхүү судалгаа нь таны санал бодлыг мэдэх зорилготой бөгөөд хариултууд нууцлагдана.',
    description_en: 'This survey aims to understand your opinions. All responses are kept confidential.',
    description_ko: '이 설문조사는 여러분의 의견을 이해하기 위한 것입니다. 모든 응답은 비밀이 보장됩니다.',
    category: pick(CATEGORIES),
    status: 'active',
    reward_amount: reward,
    max_responses: maxResp,
    current_responses: currentResp,
    estimated_minutes: rand(3, 20),
    starts_at: now.toISOString(),
    ends_at: endsAt.toISOString(),
    is_anonymous: Math.random() > 0.5,
    company: { name: company.name, name_en: company.name_en, logo_url: company.logo },
    match_score: rand(40, 100),
    trust_level_required: pick([1, 1, 1, 1, 2, 2, 3]),
    questions: createQuestions(id, qCount),
    created_at: new Date(now.getTime() - rand(1, 7) * 86400000).toISOString(),
  }
}

function createTransactions(count: number): MockTransaction[] {
  let balance = 45000
  const txns: MockTransaction[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const type = pick(['earned', 'earned', 'earned', 'withdrawn', 'pending', 'released'] as const)
    const amount = type === 'withdrawn' ? -rand(10000, 30000) : rand(1000, 20000)
    balance += amount
    if (balance < 0) balance = rand(5000, 20000)

    txns.push({
      id: uid(),
      type,
      amount: Math.abs(amount),
      balance_after: balance,
      note: type === 'earned' ? 'Судалгааны шагнал' : type === 'withdrawn' ? 'Мөнгө авсан' : 'Хүлээгдэж буй шагнал',
      note_en: type === 'earned' ? 'Survey reward' : type === 'withdrawn' ? 'Withdrawal' : 'Pending reward',
      note_ko: type === 'earned' ? '설문 보상' : type === 'withdrawn' ? '출금' : '대기 중인 보상',
      created_at: new Date(now - i * rand(3600000, 86400000)).toISOString(),
    })
  }

  return txns
}

function createNotifications(count: number): MockNotification[] {
  const types = [
    { event: 'reward_granted', title: 'Шагнал олгогдлоо', title_en: 'Reward Granted', title_ko: '보상 지급', body: 'Таны хэтэвчинд 5,000₮ нэмэгдлээ', body_en: '5,000₮ has been added to your wallet', body_ko: '5,000₮가 지갑에 추가되었습니다' },
    { event: 'reward_pending', title: 'Шагнал хүлээгдэж буй', title_en: 'Reward Pending', title_ko: '보상 대기 중', body: 'Шагнал 24 цагийн дотор олгогдоно', body_en: 'Reward will be credited within 24 hours', body_ko: '보상은 24시간 이내에 지급됩니다' },
    { event: 'survey_invitation', title: 'Шинэ судалгаа', title_en: 'New Survey', title_ko: '새 설문', body: 'Танд тохирох шинэ судалгаа байна', body_en: 'A new matching survey is available', body_ko: '새로운 맞춤 설문이 있습니다' },
    { event: 'withdrawal_complete', title: 'Мөнгө шилжүүлсэн', title_en: 'Withdrawal Complete', title_ko: '출금 완료', body: 'Мөнгө амжилттай шилжүүллээ', body_en: 'Your withdrawal was processed successfully', body_ko: '출금이 성공적으로 처리되었습니다' },
  ]
  const now = Date.now()

  return Array.from({ length: count }, (_, i) => {
    const t = pick(types)
    return {
      id: uid(),
      event_type: t.event,
      title: t.title,
      title_en: t.title_en,
      title_ko: t.title_ko,
      body: t.body,
      body_en: t.body_en,
      body_ko: t.body_ko,
      is_read: i > 4,
      created_at: new Date(now - i * rand(1800000, 43200000)).toISOString(),
    }
  })
}

function createSurveyHistory(): MockSurveyHistoryItem[] {
  const statuses: Array<'completed' | 'pending_review' | 'invalidated'> = ['completed', 'completed', 'completed', 'pending_review', 'invalidated']
  const now = Date.now()
  return Array.from({ length: 12 }, (_, i) => {
    const status = pick(statuses)
    const titleSet = pick(SURVEY_TITLES)
    const reward = pick([0, 1000, 2000, 3000, 5000, 10000, 15000])
    return {
      id: uid(),
      survey_id: uid(),
      survey_title: titleSet.mn,
      survey_title_en: titleSet.en,
      survey_title_ko: titleSet.ko,
      status,
      reward_amount: reward,
      reward_status: status === 'completed' ? 'granted' : status === 'pending_review' ? 'pending' : 'invalidated',
      completed_at: new Date(now - i * rand(3600000, 86400000 * 2)).toISOString(),
    }
  })
}

// ── Database ─────────────────────────────────────────

export const mockUser: AuthUser = {
  id: 'user-001',
  email: 'batbold@gmail.com',
  responses_count: 18,
  avg_quality_score: 82,
  full_name: `${pick(MN_LAST)} ${pick(MN_FIRST)}`,
  phone: '+97699112233',
  avatar_url: 'https://ui-avatars.com/api/?name=BB&background=3b82f6&color=fff',
  role: 'respondent',
  trust_level: 2,
  profile_score: 72,
  preferred_lang: 'mn',
  is_verified: false,
  warning_count: 0,
}

export const mockProfile = {
  user_id: mockUser.id,
  birth_date: '1995-06-15',
  gender: 'male',
  province: 'UB',
  district: 'BZD',
  occupation: 'IT Engineer',
  education_level: 'bachelor',
  marital_status: 'single',
  income_range: '1m_3m',
  interests: ['technology', 'sports', 'finance'],
  languages: ['mn', 'en'],
  profile_score: 72,
}

export const mockWallet = {
  balance: 45000,
  pending_balance: 5000,
  total_earned: 128000,
  total_withdrawn: 78000,
}

export const db = {
  user: { ...mockUser },
  profile: { ...mockProfile },
  wallet: { ...mockWallet },
  surveys: Array.from({ length: 50 }, createSurvey),
  transactions: createTransactions(200),
  notifications: createNotifications(20),
  responses: new Map<string, { survey_id: string; status: string; quality_score: number; reward_amount: number }>(),
  surveyHistory: createSurveyHistory(),
  withdrawals: new Map<string, MockWithdrawal>(),
}

// ── Company / Admin Mock Data ─────────────────────────

export const mockCompanyUser: CompanyUser = {
  id: 'company-001',
  email: 'company@idap.mn',
  full_name: 'Bat-Erdene Gantulga',
  company_id: 'co-001',
  company_name: 'MCS Group',
  company_logo: 'https://ui-avatars.com/api/?name=MCS&background=4f46e5&color=fff',
  role: 'owner',
  credits_balance: 450000,
  is_approved: true,
  plan: 'growth',
}

export const mockAdminUser: AdminUser = {
  id: 'admin-001',
  email: 'admin@idap.mn',
  full_name: 'Oyunbaatar S.',
  admin_role: 'super_admin',
}

const COMPANY_NAMES = [
  { name: 'MCS Group', email: 'info@mcs.mn' },
  { name: 'Монголын Телеком', email: 'hello@mobicom.mn' },
  { name: 'Хаан Банк', email: 'digital@khanbank.mn' },
  { name: 'Голомт Банк', email: 'info@golomtbank.mn' },
  { name: 'APU Company', email: 'marketing@apu.mn' },
  { name: 'Tenger Insurance', email: 'info@tenger.mn' },
  { name: 'Nomin Holdings', email: 'nomin@nomin.mn' },
  { name: 'Mobicom Corp', email: 'support@mobicom.mn' },
  { name: 'Newcom Group', email: 'hello@newcom.mn' },
  { name: 'SB Capital', email: 'info@sbcapital.mn' },
  { name: 'Trade and Development Bank', email: 'digital@tdb.mn' },
  { name: 'Rich Family', email: 'info@richfamily.mn' },
]

const FRAUD_TRIGGERS = [
  'straight_lining', 'too_fast', 'duplicate_ip', 'bot_pattern',
  'inconsistent_answers', 'vpn_detected', 'rapid_submission',
]

function createCompanies() {
  const statuses: Array<'pending' | 'approved' | 'suspended'> = ['approved', 'approved', 'approved', 'pending', 'pending', 'suspended']
  const plans: Array<'starter' | 'growth' | 'enterprise'> = ['starter', 'growth', 'growth', 'enterprise', 'starter']
  const now = Date.now()
  return COMPANY_NAMES.map((c, i) => ({
    id: `co-${i + 1}`,
    company_name: c.name,
    email: c.email,
    status: pick(statuses),
    plan: pick(plans),
    surveys_count: rand(0, 45),
    total_spent: rand(0, 5000) * 1000,
    joined_at: new Date(now - rand(30, 365) * 86400000).toISOString(),
  }))
}

function createRespondentsAdmin() {
  const statuses: Array<'active' | 'warned' | 'suspended'> = ['active', 'active', 'active', 'active', 'warned', 'suspended']
  const now = Date.now()
  return Array.from({ length: 30 }, (_, i) => ({
    id: `resp-${i + 1}`,
    full_name: `${pick(MN_LAST)} ${pick(MN_FIRST)}`,
    email: `user${i + 1}@example.mn`,
    trust_level: rand(1, 5),
    profile_score: rand(20, 100),
    surveys_completed: rand(0, 200),
    total_earned: rand(0, 500) * 1000,
    warning_count: rand(0, 4),
    status: pick(statuses),
    joined_at: new Date(now - rand(1, 365) * 86400000).toISOString(),
    avg_quality_score: rand(45, 98),
    last_active_at: new Date(now - rand(0, 30) * 86400000).toISOString(),
  }))
}

function createFraudAlerts() {
  const severities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'medium', 'low', 'low']
  const adminStatuses: Array<'open' | 'investigating' | 'dismissed' | 'banned'> = ['open', 'open', 'open', 'investigating', 'dismissed', 'banned']
  const now = Date.now()
  return Array.from({ length: 15 }, (_, i) => ({
    id: `fraud-${i + 1}`,
    respondent_id: `resp-${rand(1, 30)}`,
    respondent_name: `${pick(MN_LAST)} ${pick(MN_FIRST)}`,
    survey_id: `s-${rand(1, 50)}`,
    survey_title: pick(SURVEY_TITLES).en,
    trigger: pick(FRAUD_TRIGGERS),
    severity: pick(severities),
    details: 'Automated system flagged anomalous behavior pattern',
    status: pick(adminStatuses),
    detected_at: new Date(now - rand(1, 72) * 3600000).toISOString(),
  }))
}

function createPayouts() {
  const gateways: Array<'qpay' | 'bonum'> = ['qpay', 'qpay', 'bonum']
  const payoutStatuses: Array<'pending' | 'processing' | 'completed' | 'failed'> = ['pending', 'pending', 'pending', 'processing', 'completed', 'completed', 'failed']
  const now = Date.now()
  return Array.from({ length: 20 }, (_, i) => ({
    id: `payout-${i + 1}`,
    respondent_name: `${pick(MN_LAST)} ${pick(MN_FIRST)}`,
    respondent_email: `user${i + 1}@example.mn`,
    amount: pick([10000, 15000, 20000, 30000, 50000]),
    gateway: pick(gateways),
    account: pick(gateways) === 'qpay' ? `9${rand(1000, 9999)}${rand(1000, 9999)}` : `50${rand(100, 999)}${rand(1000, 9999)}`,
    status: pick(payoutStatuses),
    requested_at: new Date(now - rand(1, 48) * 3600000).toISOString(),
  }))
}

function createCompanySurveys() {
  const now = Date.now()
  const surveyStatuses: Array<'active' | 'paused' | 'completed' | 'draft'> = ['active', 'active', 'paused', 'completed', 'draft']
  return Array.from({ length: 12 }, (_, i) => {
    const maxResp = rand(50, 500)
    const titleSet = pick(SURVEY_TITLES)
    return {
      id: `co-survey-${i + 1}`,
      title: titleSet.en,
      category: pick(CATEGORIES),
      status: pick(surveyStatuses),
      current_responses: rand(0, maxResp),
      max_responses: maxResp,
      reward_amount: pick([500, 1000, 2000, 3000, 5000]),
      estimated_minutes: rand(3, 15),
      ends_at: new Date(now + rand(1, 30) * 86400000).toISOString(),
      created_at: new Date(now - rand(1, 14) * 86400000).toISOString(),
    }
  })
}

function createCompanyBillingTxns() {
  const now = Date.now()
  return Array.from({ length: 15 }, (_, i) => ({
    id: `billing-${i + 1}`,
    type: i % 3 === 0 ? 'purchase' : 'spent' as 'purchase' | 'spent',
    amount: i % 3 === 0 ? pick([100000, 500000, 1000000]) : rand(5, 50) * 1000,
    note: i % 3 === 0 ? 'Credits purchased' : `Survey spend — ${pick(SURVEY_TITLES).en}`,
    created_at: new Date(now - i * rand(86400000, 86400000 * 3)).toISOString(),
  }))
}

function createAnalyticsData(surveyId: string, title: string) {
  const provinces = ['Ulaanbaatar', 'Darkhan', 'Erdenet', 'Bayan-Ölgii', 'Orkhon', 'Selenge', 'Töv', 'Khövsgöl']
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000)
    return { date: `${d.getMonth() + 1}/${d.getDate()}`, count: rand(10, 80) }
  })
  return {
    survey_id: surveyId,
    survey_title: title,
    total_responses: rand(200, 800),
    completion_rate: rand(55, 92),
    avg_time_seconds: rand(180, 720),
    quality_distribution: [
      { label: 'High quality', count: rand(100, 400), color: '#22c55e' },
      { label: 'Medium', count: rand(50, 200), color: '#f59e0b' },
      { label: 'Low quality', count: rand(10, 80), color: '#ef4444' },
      { label: 'Invalidated', count: rand(5, 30), color: '#94a3b8' },
    ],
    daily_responses: days,
    gender_breakdown: [
      { label: 'Male', pct: 52, color: '#4f46e5' },
      { label: 'Female', pct: 44, color: '#ec4899' },
      { label: 'Other', pct: 4, color: '#94a3b8' },
    ],
    age_breakdown: [
      { label: '18-24', pct: 28 },
      { label: '25-34', pct: 35 },
      { label: '35-44', pct: 22 },
      { label: '45+', pct: 15 },
    ],
    province_breakdown: provinces.map((p) => ({ label: p, count: rand(5, 120) })),
    drop_off: [
      { question: 'Q1: Demographics', remaining: 100 },
      { question: 'Q2: Brand awareness', remaining: rand(85, 97) },
      { question: 'Q3: Product usage', remaining: rand(75, 90) },
      { question: 'Q4: Satisfaction', remaining: rand(65, 82) },
      { question: 'Q5: Open feedback', remaining: rand(55, 75) },
    ],
  }
}

function createActivityFeed() {
  const types = ['company_registered', 'fraud_detected', 'payout_requested', 'survey_published'] as const
  const now = Date.now()
  return Array.from({ length: 20 }, (_, i) => {
    const type = pick(types)
    const messages: Record<string, string> = {
      company_registered: `${pick(COMPANY_NAMES).name} registered and awaiting approval`,
      fraud_detected: `Fraud alert: ${pick(FRAUD_TRIGGERS)} detected for user`,
      payout_requested: `Withdrawal of ₮${rand(10, 50)}K requested`,
      survey_published: `New survey published by ${pick(COMPANY_NAMES).name}`,
    }
    return {
      id: `activity-${i + 1}`,
      type,
      message: messages[type]!,
      time: new Date(now - i * rand(600000, 3600000)).toLocaleTimeString(),
      severity: type === 'fraud_detected' ? pick(['high', 'medium', 'low'] as const) : undefined,
    }
  })
}

const now = Date.now()
const companyNotifications = [
  { id: 'cn-1', type: 'survey_response', title: 'New responses received', message: 'Your "Customer Satisfaction Survey" received 12 new responses today.', read: false, created_at: new Date(now - 1 * 3600000).toISOString() },
  { id: 'cn-2', type: 'low_credits', title: 'Low credits warning', message: 'Your account balance is below ₮50,000. Top up to keep surveys running.', read: false, created_at: new Date(now - 3 * 3600000).toISOString() },
  { id: 'cn-3', type: 'survey_completed', title: 'Survey completed', message: '"Brand Awareness Survey" has reached its maximum response quota of 500.', read: false, created_at: new Date(now - 6 * 3600000).toISOString() },
  { id: 'cn-4', type: 'survey_approved', title: 'Survey approved', message: 'Your survey "Product Feedback Q2" has been approved and is now live.', read: true, created_at: new Date(now - 24 * 3600000).toISOString() },
  { id: 'cn-5', type: 'weekly_report', title: 'Weekly report ready', message: 'Your weekly analytics report is ready. View response trends and quality scores.', read: true, created_at: new Date(now - 48 * 3600000).toISOString() },
  { id: 'cn-6', type: 'survey_response', title: 'Response milestone', message: '"Employee Survey 2026" reached 100 responses — 33% of your target.', read: true, created_at: new Date(now - 72 * 3600000).toISOString() },
]

export const companyDb = {
  user: { ...mockCompanyUser },
  surveys: createCompanySurveys(),
  billingTxns: createCompanyBillingTxns(),
  analyticsCache: new Map<string, ReturnType<typeof createAnalyticsData>>(),
  notifications: companyNotifications as Array<Record<string, unknown>>,
}

const adminNotifications = [
  { id: 'an-1', type: 'fraud_alert', title: 'High severity fraud detected', message: 'User mock-45 flagged for duplicate_ip activity across 8 survey submissions.', read: false, severity: 'high', created_at: new Date(now - 0.5 * 3600000).toISOString() },
  { id: 'an-2', type: 'company_registered', title: 'New company awaiting approval', message: 'Монголын Телеком has registered and submitted their company profile for review.', read: false, created_at: new Date(now - 2 * 3600000).toISOString() },
  { id: 'an-3', type: 'payout_requested', title: 'Payout request submitted', message: 'Respondent Батаа requested withdrawal of ₮45,000 via QPay.', read: false, created_at: new Date(now - 4 * 3600000).toISOString() },
  { id: 'an-4', type: 'fraud_alert', title: 'Fraud alert: VPN detected', message: 'Multiple accounts sharing the same VPN IP completing surveys in quick succession.', read: false, severity: 'medium', created_at: new Date(now - 5 * 3600000).toISOString() },
  { id: 'an-5', type: 'survey_published', title: 'Survey published by MCS Group', message: 'New survey "Product Market Fit 2026" is now live with 500 response target.', read: true, created_at: new Date(now - 12 * 3600000).toISOString() },
  { id: 'an-6', type: 'company_registered', title: 'APU Company approved', message: 'APU Company registration was approved. Their first survey is now under review.', read: true, created_at: new Date(now - 24 * 3600000).toISOString() },
  { id: 'an-7', type: 'user_registered', title: 'User growth spike', message: '47 new respondents registered in the last 24 hours — 3x the daily average.', read: true, created_at: new Date(now - 36 * 3600000).toISOString() },
  { id: 'an-8', type: 'payout_requested', title: 'Large payout request', message: 'Respondent Нарандэлгэр requested withdrawal of ₮120,000 — manual review required.', read: true, created_at: new Date(now - 48 * 3600000).toISOString() },
]

export const adminDb = {
  user: { ...mockAdminUser },
  companies: createCompanies(),
  respondents: createRespondentsAdmin(),
  fraudAlerts: createFraudAlerts(),
  payouts: createPayouts(),
  activityFeed: createActivityFeed(),
  notifications: adminNotifications as Array<Record<string, unknown>>,
  settings: {
    notifications: { fraud_alerts: true, company_approvals: true, payout_requests: true, system_alerts: true, weekly_summary: false },
    security: { two_factor_enabled: false, session_timeout_minutes: 60 },
  },
  allSurveys: db.surveys.map((s) => ({
    id: s.id,
    title: s.title_en,
    company_name: s.company.name_en,
    category: s.category,
    status: s.status,
    current_responses: s.current_responses,
    max_responses: s.max_responses,
    reward_amount: s.reward_amount,
    trust_level_required: s.trust_level_required,
    created_at: s.created_at,
  })),
}

// Pre-populate analytics cache for company surveys
companyDb.surveys.forEach((s) => {
  companyDb.analyticsCache.set(s.id, createAnalyticsData(s.id, s.title))
})
