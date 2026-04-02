import { http, HttpResponse, delay } from 'msw'
import { db, companyDb, adminDb } from './db'
import type { MockSurvey, MockQuestion, MockSurveyHistoryItem } from './db'

const API = import.meta.env.VITE_API_URL ?? '/api/v1'

function ok<T>(data: T, meta?: Record<string, unknown>) {
  return HttpResponse.json({ success: true, data, meta: meta ?? null, error: null })
}

function err(code: string, message: string, status: number = 400) {
  return HttpResponse.json(
    { success: false, data: null, error: { code, message } },
    { status }
  )
}

// Get user's language from localStorage (i18next stores it there)
function getLang(): string {
  try {
    return localStorage.getItem('i18nextLng') ?? 'mn'
  } catch {
    return 'mn'
  }
}

// Localize a survey object based on current language
function localizeSurvey(s: MockSurvey, lang: string) {
  const title = lang === 'en' ? s.title_en : lang === 'ko' ? s.title_ko : s.title
  const description = lang === 'en' ? s.description_en : lang === 'ko' ? s.description_ko : s.description
  const companyName = lang === 'en' ? s.company.name_en : s.company.name

  return {
    ...s,
    title,
    description,
    company: { name: companyName, logo_url: s.company.logo_url },
  }
}

// Localize questions
function localizeQuestion(q: MockQuestion, lang: string) {
  const title = lang === 'en' ? q.title_en : lang === 'ko' ? q.title_ko : q.title
  const options = q.options?.map((o) => ({
    id: o.id,
    label: lang === 'en' ? o.label_en : lang === 'ko' ? o.label_ko : o.label,
  }))
  const rows = q.rows?.map((r) => ({
    id: r.id,
    label: lang === 'en' ? r.label_en : lang === 'ko' ? r.label_ko : r.label,
  }))
  return { ...q, title, options, rows }
}

export const handlers = [
  // ── Auth ──────────────────────────────────────────

  http.post(`${API}/auth/login`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Record<string, string>
    if (!body.email || !body.password) {
      return err('VALIDATION_ERROR', 'Email and password required')
    }
    return ok({
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      expires_in: 900,
      actor: 'respondent',
      user: db.user,
    })
  }),

  http.post(`${API}/auth/register/respondent`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Record<string, string>
    if (!body.email || !body.password || !body.full_name) {
      return err('VALIDATION_ERROR', 'All fields required')
    }
    db.user.email = body.email
    db.user.full_name = body.full_name
    db.user.profile_score = 0
    return ok({
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
      user: db.user,
    })
  }),

  http.post(`${API}/auth/token/refresh`, async () => {
    await delay(100)
    return ok({
      access_token: 'mock-access-token-' + Date.now(),
      refresh_token: 'mock-refresh-token-' + Date.now(),
    })
  }),

  http.post(`${API}/auth/logout`, async () => {
    await delay(100)
    return ok(null)
  }),

  // ── User / Profile ───────────────────────────────

  http.get(`${API}/auth/me`, async () => {
    await delay(200)
    return ok(db.user)
  }),

  http.get(`${API}/respondent/profile`, async () => {
    await delay(200)
    return ok(db.profile)
  }),

  http.put(`${API}/respondent/profile`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Record<string, unknown>
    Object.assign(db.profile, body)

    // Recalculate profile score
    const fields = ['birth_date', 'gender', 'province', 'district', 'occupation', 'education_level', 'income_range', 'interests', 'marital_status']
    const weights = [15, 10, 15, 15, 10, 8, 10, 10, 7]
    let score = 0
    fields.forEach((f, i) => {
      const val = db.profile[f as keyof typeof db.profile]
      if (val && (!Array.isArray(val) || val.length > 0)) score += weights[i]!
    })
    db.profile.profile_score = score
    db.user.profile_score = score

    return ok(db.profile)
  }),

  http.get(`${API}/respondent/profile/score`, async () => {
    await delay(200)
    const fields = [
      { field: 'birth_date', weight: 15 },
      { field: 'gender', weight: 10 },
      { field: 'province', weight: 15 },
      { field: 'district', weight: 15 },
      { field: 'occupation', weight: 10 },
      { field: 'income_range', weight: 10 },
      { field: 'interests', weight: 10 },
      { field: 'education_level', weight: 8 },
      { field: 'marital_status', weight: 7 },
    ]
    const items = fields.map((f) => {
      const val = db.profile[f.field as keyof typeof db.profile]
      return { ...f, completed: Boolean(val && (!Array.isArray(val) || val.length > 0)) }
    })
    return ok({ total_score: db.profile.profile_score, items })
  }),

  // ── Survey History ───────────────────────────────

  http.get(`${API}/respondent/surveys/history`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = parseInt(url.searchParams.get('limit') ?? '20')
    const status = url.searchParams.get('status')
    const lang = getLang()

    let items = [...db.surveyHistory]
    if (status && status !== 'all') items = items.filter((h) => h.status === status)

    const startIndex = cursor ? items.findIndex((h) => h.id === cursor) + 1 : 0
    const page = items.slice(startIndex, startIndex + limit)
    const nextCursor = page.length === limit ? page[page.length - 1]?.id : undefined

    const localized = page.map(({ survey_title_en, survey_title_ko, ...h }) => ({
      ...h,
      survey_title: lang === 'en' ? survey_title_en : lang === 'ko' ? survey_title_ko : h.survey_title,
    }))

    return ok(localized, { cursor: nextCursor, has_next: Boolean(nextCursor) })
  }),

  // ── Survey Feed ──────────────────────────────────

  http.get(`${API}/respondent/surveys`, async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = parseInt(url.searchParams.get('limit') ?? '20')
    const category = url.searchParams.get('category')
    const sort = url.searchParams.get('sort') ?? 'recommended'

    let surveys = [...db.surveys].filter((s) => s.status === 'active')
    if (category) surveys = surveys.filter((s) => s.category === category)

    if (sort === 'reward_high') surveys.sort((a, b) => b.reward_amount - a.reward_amount)
    else if (sort === 'deadline') surveys.sort((a, b) => new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime())
    else if (sort === 'short') surveys.sort((a, b) => a.estimated_minutes - b.estimated_minutes)
    else surveys.sort((a, b) => b.match_score - a.match_score)

    const startIndex = cursor ? surveys.findIndex((s) => s.id === cursor) + 1 : 0
    const page = surveys.slice(startIndex, startIndex + limit)
    const nextCursor = page.length === limit ? page[page.length - 1]?.id : undefined

    const lang = getLang()

    // Strip questions, localize, add computed fields
    const feedItems = page.map((s) => {
      const localized = localizeSurvey(s, lang)
      const { questions: _q, title_en: _te, title_ko: _tk, description_en: _de, description_ko: _dk, ...rest } = localized
      return {
        ...rest,
        remaining_spots: s.max_responses - s.current_responses,
        is_free: s.reward_amount === 0,
      }
    })

    return ok(feedItems, { cursor: nextCursor, has_next: Boolean(nextCursor) })
  }),

  // ── Survey Detail ────────────────────────────────

  http.get(`${API}/respondent/surveys/:id`, async ({ params }) => {
    await delay(200)
    const survey = db.surveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)
    const lang = getLang()
    const localized = localizeSurvey(survey, lang)
    const localizedQuestions = survey.questions.map((q) => localizeQuestion(q, lang))
    const { title_en: _te, title_ko: _tk, description_en: _de, description_ko: _dk, ...rest } = localized
    return ok({ ...rest, questions: localizedQuestions })
  }),

  http.get(`${API}/respondent/surveys/:id/questions`, async ({ params }) => {
    await delay(200)
    const survey = db.surveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)
    const lang = getLang()
    return ok(survey.questions.map((q) => localizeQuestion(q, lang)))
  }),

  // ── Survey Start & Submit ────────────────────────

  http.post(`${API}/respondent/surveys/:id/start`, async ({ params }) => {
    await delay(300)
    const survey = db.surveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)

    const lang = getLang()
    const responseId = 'resp-' + Date.now()
    db.responses.set(responseId, {
      survey_id: survey.id,
      status: 'in_progress',
      quality_score: 0,
      reward_amount: 0,
    })

    return ok({ response_id: responseId, questions: survey.questions.map((q) => localizeQuestion(q, lang)) })
  }),

  http.post(`${API}/respondent/surveys/:id/submit`, async ({ params }) => {
    await delay(500)
    const survey = db.surveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)

    const qualityScore = 70 + Math.floor(Math.random() * 30) // 70-99
    const isInstant = qualityScore >= 80
    const rewardAmount = isInstant ? survey.reward_amount : 0

    if (isInstant && survey.reward_amount > 0) {
      db.wallet.balance += survey.reward_amount
      db.wallet.total_earned += survey.reward_amount
      db.transactions.unshift({
        id: 'tx-' + Date.now(),
        type: 'earned',
        amount: survey.reward_amount,
        balance_after: db.wallet.balance,
        note: `${survey.title} — шагнал`,
        note_en: `${survey.title_en} — reward`,
        note_ko: `${survey.title_ko} — 보상`,
        created_at: new Date().toISOString(),
      })
    } else if (qualityScore >= 50 && survey.reward_amount > 0) {
      db.wallet.pending_balance += survey.reward_amount
    }

    survey.current_responses++

    // Add to survey history
    const historyStatus = isInstant ? 'completed' : qualityScore >= 50 ? 'pending_review' : 'invalidated'
    db.surveyHistory.unshift({
      id: 'hist-' + Date.now(),
      survey_id: survey.id,
      survey_title: survey.title,
      survey_title_en: survey.title_en,
      survey_title_ko: survey.title_ko,
      status: historyStatus,
      reward_amount: survey.reward_amount,
      reward_status: isInstant ? 'granted' : qualityScore >= 50 ? 'pending' : 'invalidated',
      completed_at: new Date().toISOString(),
    } as MockSurveyHistoryItem)

    return ok({
      response_id: 'resp-' + Date.now(),
      status: isInstant ? 'completed' : qualityScore >= 50 ? 'pending_review' : 'invalidated',
      quality_score: qualityScore,
      reward: {
        amount: survey.reward_amount,
        status: isInstant ? 'granted' : qualityScore >= 50 ? 'pending' : 'invalidated',
        wallet_balance_after: db.wallet.balance,
      },
    })
  }),

  // ── Wallet ───────────────────────────────────────

  http.get(`${API}/respondent/wallet`, async () => {
    await delay(200)
    return ok(db.wallet)
  }),

  http.get(`${API}/respondent/wallet/transactions`, async ({ request }) => {
    await delay(200)
    const url = new URL(request.url)
    const cursor = url.searchParams.get('cursor')
    const limit = parseInt(url.searchParams.get('limit') ?? '20')
    const type = url.searchParams.get('type')
    const lang = getLang()

    let txns = [...db.transactions]
    if (type && type !== 'all') txns = txns.filter((t) => t.type === type)

    const startIndex = cursor ? txns.findIndex((t) => t.id === cursor) + 1 : 0
    const page = txns.slice(startIndex, startIndex + limit)
    const nextCursor = page.length === limit ? page[page.length - 1]?.id : undefined

    const localized = page.map(({ note_en, note_ko, ...tx }) => ({
      ...tx,
      note: lang === 'en' ? note_en : lang === 'ko' ? note_ko : tx.note,
    }))

    return ok(localized, { cursor: nextCursor, has_next: Boolean(nextCursor) })
  }),

  http.post(`${API}/respondent/wallet/withdraw`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { amount: number; gateway: string; account_info: Record<string, string> }

    if (body.amount < 10000) return err('MIN_AMOUNT', 'Minimum withdrawal is ₮10,000')
    if (body.amount > db.wallet.balance) return err('INSUFFICIENT_BALANCE', 'Insufficient balance')

    // Deduct immediately; resolve after polling
    db.wallet.balance -= body.amount

    const withdrawalId = 'wd-' + Date.now()
    db.withdrawals.set(withdrawalId, {
      id: withdrawalId,
      status: 'pending',
      amount: body.amount,
      created_at: Date.now(),
    })

    return ok({ withdrawal_id: withdrawalId, status: 'pending', amount: body.amount })
  }),

  http.get(`${API}/respondent/wallet/withdraw/:id`, async ({ params }) => {
    await delay(200)
    const wd = db.withdrawals.get(params.id as string)
    if (!wd) return err('NOT_FOUND', 'Withdrawal not found', 404)

    const elapsed = Date.now() - wd.created_at
    if (elapsed > 4000 && wd.status === 'pending') {
      // 85% success, 15% fail
      const success = Math.random() > 0.15
      wd.status = success ? 'completed' : 'failed'

      if (success) {
        db.wallet.total_withdrawn += wd.amount
        db.transactions.unshift({
          id: 'tx-' + Date.now(),
          type: 'withdrawn',
          amount: wd.amount,
          balance_after: db.wallet.balance,
          note: 'Мөнгө авсан',
          note_en: 'Withdrawal processed',
          note_ko: '출금 처리됨',
          created_at: new Date().toISOString(),
        })
      } else {
        // Auto-refund
        db.wallet.balance += wd.amount
        db.transactions.unshift({
          id: 'tx-' + Date.now(),
          type: 'refunded',
          amount: wd.amount,
          balance_after: db.wallet.balance,
          note: 'Буцаалт (гүйлгээ амжилтгүй)',
          note_en: 'Auto-refunded (withdrawal failed)',
          note_ko: '자동 환불 (출금 실패)',
          created_at: new Date().toISOString(),
        })
      }
    }

    return ok({ withdrawal_id: wd.id, status: wd.status, amount: wd.amount })
  }),

  // ── Notifications ────────────────────────────────

  http.get(`${API}/notifications`, async () => {
    await delay(200)
    const lang = getLang()
    const localized = db.notifications.map((n) => ({
      ...n,
      title: lang === 'en' ? n.title_en : lang === 'ko' ? n.title_ko : n.title,
      body: lang === 'en' ? n.body_en : lang === 'ko' ? n.body_ko : n.body,
    }))
    return ok(localized)
  }),

  http.put(`${API}/notifications/:id/read`, async ({ params }) => {
    await delay(100)
    const notif = db.notifications.find((n) => n.id === params.id)
    if (notif) notif.is_read = true
    return ok(null)
  }),

  http.put(`${API}/notifications/read-all`, async () => {
    await delay(100)
    db.notifications.forEach((n) => (n.is_read = true))
    return ok(null)
  }),

  // ── Common ───────────────────────────────────────

  http.get(`${API}/health`, () => {
    return ok({ status: 'ok', uptime: process.uptime?.() ?? 0 })
  }),

  // ══════════════════════════════════════════════════
  // COMPANY (CLIENT) API
  // ══════════════════════════════════════════════════

  http.post(`${API}/company/auth/login`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as Record<string, string>
    if (!body.email || !body.password) return err('VALIDATION_ERROR', 'Email and password required')
    // Accept any credentials in dev
    return ok({
      access_token: 'company-access-token-' + Date.now(),
      refresh_token: 'company-refresh-token-' + Date.now(),
      user: companyDb.user,
    })
  }),

  http.get(`${API}/company/dashboard`, async () => {
    await delay(300)
    const active = companyDb.surveys.filter((s) => s.status === 'active').length
    const totalResponses = companyDb.surveys.reduce((sum, s) => sum + s.current_responses, 0)
    const completionRate = Math.round(
      companyDb.surveys.reduce((sum, s) => sum + Math.round((s.current_responses / s.max_responses) * 100), 0)
      / Math.max(companyDb.surveys.length, 1)
    )
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return ok({
      active_surveys: active,
      total_responses_month: totalResponses,
      credits_balance: companyDb.user.credits_balance,
      avg_completion_rate: completionRate,
      responses_trend: days.map((day) => ({ day, count: Math.floor(Math.random() * 80) + 10 })),
    })
  }),

  http.get(`${API}/company/surveys/:id/responses`, async ({ params }) => {
    await delay(200)
    const survey = companyDb.surveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)
    const MN_NAMES = ['Батаа', 'Мөнхбат', 'Оюунбаяр', 'Дулмаа', 'Энхтүвшин', 'Ганбаатар', 'Номин', 'Нарандэлгэр']
    const qualities: Array<'high' | 'medium' | 'low'> = ['high', 'high', 'medium', 'low']
    const statuses: Array<'earned' | 'pending' | 'invalidated'> = ['earned', 'earned', 'pending', 'invalidated']
    const now = Date.now()
    const count = Math.min(survey.current_responses, 8)
    const responses = Array.from({ length: count }, (_, i) => ({
      id: `resp-${survey.id}-${i}`,
      respondent_name: MN_NAMES[i % MN_NAMES.length]!,
      quality: qualities[i % qualities.length]!,
      status: statuses[i % statuses.length]!,
      submitted_at: new Date(now - i * 3600000 * 2).toISOString(),
    }))
    return ok(responses)
  }),

  http.get(`${API}/company/surveys/:id`, async ({ params }) => {
    await delay(250)
    const survey = companyDb.surveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)
    return ok({
      ...survey,
      description: 'This survey collects valuable feedback from participants about their experience and preferences.',
      is_anonymous: true,
      trust_level_required: 2,
      est_minutes: survey.estimated_minutes,
      questions_count: Math.floor(Math.random() * 8) + 5,
      budget_spent: survey.current_responses * survey.reward_amount,
      avg_completion_rate: Math.floor(Math.random() * 30) + 65,
      avg_quality_score: (Math.random() * 2 + 3).toFixed(1),
    })
  }),

  http.get(`${API}/company/surveys`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') ?? '50')
    return ok(companyDb.surveys.slice(0, limit))
  }),

  http.post(`${API}/company/surveys`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as Record<string, unknown>
    const newSurvey = {
      id: 'co-survey-' + Date.now(),
      title: body.title as string,
      category: body.category as string,
      status: body.status as string ?? 'draft',
      current_responses: 0,
      max_responses: (body.max_responses as number) ?? 100,
      reward_amount: (body.reward_amount as number) ?? 1000,
      estimated_minutes: (body.estimated_minutes as number) ?? 5,
      ends_at: body.ends_at as string ?? new Date(Date.now() + 30 * 86400000).toISOString(),
      created_at: new Date().toISOString(),
    }
    companyDb.surveys.unshift(newSurvey)
    return ok(newSurvey)
  }),

  http.patch(`${API}/company/surveys/:id/status`, async ({ params, request }) => {
    await delay(200)
    const body = (await request.json()) as { status: string }
    const survey = companyDb.surveys.find((s) => s.id === params.id)
    if (survey) survey.status = body.status as typeof survey.status
    return ok(survey ?? null)
  }),

  http.delete(`${API}/company/surveys/:id`, async ({ params }) => {
    await delay(200)
    const idx = companyDb.surveys.findIndex((s) => s.id === params.id)
    if (idx !== -1) companyDb.surveys.splice(idx, 1)
    return ok(null)
  }),

  http.get(`${API}/company/surveys/:id/analytics`, async ({ params }) => {
    await delay(400)
    const survey = companyDb.surveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)
    let analytics = companyDb.analyticsCache.get(params.id as string)
    if (!analytics) {
      // lazy-create
      const days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date(Date.now() - (13 - i) * 86400000)
        return { date: `${d.getMonth() + 1}/${d.getDate()}`, count: Math.floor(Math.random() * 70) + 5 }
      })
      const provinces = ['Ulaanbaatar', 'Darkhan', 'Erdenet', 'Bayan-Ölgii', 'Orkhon', 'Selenge', 'Töv', 'Khövsgöl']
      analytics = {
        survey_id: survey.id,
        survey_title: survey.title,
        total_responses: survey.current_responses,
        completion_rate: Math.floor(Math.random() * 30) + 60,
        avg_time_seconds: Math.floor(Math.random() * 400) + 200,
        quality_distribution: [
          { label: 'High quality', count: Math.floor(survey.current_responses * 0.55), color: '#22c55e' },
          { label: 'Medium', count: Math.floor(survey.current_responses * 0.28), color: '#f59e0b' },
          { label: 'Low quality', count: Math.floor(survey.current_responses * 0.12), color: '#ef4444' },
          { label: 'Invalidated', count: Math.floor(survey.current_responses * 0.05), color: '#94a3b8' },
        ],
        daily_responses: days,
        gender_breakdown: [
          { label: 'Male', pct: 52, color: '#4f46e5' },
          { label: 'Female', pct: 44, color: '#ec4899' },
          { label: 'Other', pct: 4, color: '#94a3b8' },
        ],
        age_breakdown: [
          { label: '18-24', pct: 28 }, { label: '25-34', pct: 35 },
          { label: '35-44', pct: 22 }, { label: '45+', pct: 15 },
        ],
        province_breakdown: provinces.map((p) => ({ label: p, count: Math.floor(Math.random() * 100) + 5 })),
        drop_off: [
          { question: 'Q1: Demographics', remaining: 100 },
          { question: 'Q2: Product usage', remaining: Math.floor(Math.random() * 10) + 85 },
          { question: 'Q3: Satisfaction', remaining: Math.floor(Math.random() * 15) + 72 },
          { question: 'Q4: Open feedback', remaining: Math.floor(Math.random() * 20) + 55 },
        ],
      }
      companyDb.analyticsCache.set(params.id as string, analytics)
    }
    return ok(analytics)
  }),

  http.get(`${API}/company/billing/transactions`, async () => {
    await delay(200)
    return ok(companyDb.billingTxns)
  }),

  http.post(`${API}/company/billing/purchase`, async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as { amount: number; gateway: string }
    companyDb.user.credits_balance += body.amount
    companyDb.billingTxns.unshift({
      id: 'billing-' + Date.now(),
      type: 'purchase',
      amount: body.amount,
      note: `Credits purchased via ${body.gateway}`,
      created_at: new Date().toISOString(),
    })
    return ok({ balance: companyDb.user.credits_balance })
  }),

  http.put(`${API}/company/settings`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Record<string, string>
    if (body.company_name) companyDb.user.company_name = body.company_name
    return ok(companyDb.user)
  }),

  // ══════════════════════════════════════════════════
  // ADMIN API
  // ══════════════════════════════════════════════════

  http.post(`${API}/admin/auth/login`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as Record<string, string>
    if (!body.email || !body.password) return err('VALIDATION_ERROR', 'Credentials required')
    return ok({
      access_token: 'admin-access-token-' + Date.now(),
      refresh_token: 'admin-refresh-token-' + Date.now(),
      user: adminDb.user,
    })
  }),

  http.get(`${API}/admin/dashboard`, async () => {
    await delay(300)
    const approved = adminDb.companies.filter((c) => c.status === 'approved').length
    const pending = adminDb.companies.filter((c) => c.status === 'pending').length
    const openFraud = adminDb.fraudAlerts.filter((a) => a.status === 'open').length
    const pendingPayouts = adminDb.payouts.filter((p) => p.status === 'pending')
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    return ok({
      total_respondents: db.surveys.reduce((sum) => sum + 1, 0) * 250,
      active_companies: approved,
      surveys_this_month: Math.floor(Math.random() * 30) + 10,
      pending_payouts_amount: pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
      pending_approvals: pending,
      fraud_alerts: openFraud,
      revenue_7d: days.map((day) => ({ day, amount: Math.floor(Math.random() * 500000) + 50000 })),
      user_growth_7d: days.map((day) => ({ day, count: Math.floor(Math.random() * 80) + 10 })),
    })
  }),

  http.get(`${API}/admin/activity`, async () => {
    await delay(200)
    return ok(adminDb.activityFeed)
  }),

  http.get(`${API}/admin/companies/:id/surveys`, async ({ params }) => {
    await delay(200)
    const company = adminDb.companies.find((c) => c.id === params.id)
    if (!company) return err('NOT_FOUND', 'Company not found', 404)
    const surveys = adminDb.allSurveys.slice(0, company.surveys_count).map((s) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      current_responses: s.current_responses,
      max_responses: s.max_responses,
      reward_amount: s.reward_amount,
      created_at: s.created_at,
    }))
    return ok(surveys)
  }),

  http.get(`${API}/admin/companies/:id`, async ({ params }) => {
    await delay(250)
    const company = adminDb.companies.find((c) => c.id === params.id)
    if (!company) return err('NOT_FOUND', 'Company not found', 404)
    return ok({ ...company, credits_balance: Math.floor(Math.random() * 2000) * 1000 })
  }),

  http.get(`${API}/admin/companies`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const limit = parseInt(url.searchParams.get('limit') ?? '50')
    let companies = [...adminDb.companies]
    if (status) companies = companies.filter((c) => c.status === status)
    return ok(companies.slice(0, limit))
  }),

  http.patch(`${API}/admin/companies/:id/status`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as { action: string }
    const company = adminDb.companies.find((c) => c.id === params.id)
    if (company) {
      if (body.action === 'approve') company.status = 'approved'
      else if (body.action === 'suspend') company.status = 'suspended'
      else if (body.action === 'unsuspend') company.status = 'approved'
    }
    return ok(company ?? null)
  }),

  http.get(`${API}/admin/respondents/:id/fraud`, async ({ params }) => {
    await delay(200)
    const alerts = adminDb.fraudAlerts.filter((a) => a.respondent_id === params.id)
    return ok(alerts)
  }),

  http.get(`${API}/admin/respondents/:id/history`, async ({ params }) => {
    await delay(200)
    const respondent = adminDb.respondents.find((r) => r.id === params.id)
    if (!respondent) return err('NOT_FOUND', 'Respondent not found', 404)
    const SURVEY_TITLES_EN = ['Consumer Preferences Study', 'Brand Awareness Survey', 'Product Feedback', 'User Experience Research', 'Market Analysis']
    const qualities: Array<'high' | 'medium' | 'low'> = ['high', 'high', 'medium', 'low']
    const statuses: Array<'earned' | 'pending' | 'invalidated'> = ['earned', 'earned', 'earned', 'pending', 'invalidated']
    const now = Date.now()
    const count = Math.min(respondent.surveys_completed, 8)
    const history = Array.from({ length: count }, (_, i) => ({
      id: `hist-${respondent.id}-${i}`,
      survey_title: SURVEY_TITLES_EN[i % SURVEY_TITLES_EN.length]!,
      quality: qualities[i % qualities.length]!,
      reward_status: statuses[i % statuses.length]!,
      submitted_at: new Date(now - i * 86400000).toISOString(),
    }))
    return ok(history)
  }),

  http.get(`${API}/admin/respondents/:id`, async ({ params }) => {
    await delay(250)
    const respondent = adminDb.respondents.find((r) => r.id === params.id)
    if (!respondent) return err('NOT_FOUND', 'Respondent not found', 404)
    const GENDERS = ['Male', 'Female', 'Male', 'Female', 'Other']
    const AGE_GROUPS = ['18-24', '25-34', '35-44', '25-34', '45+']
    const PROVINCES = ['Ulaanbaatar', 'Darkhan', 'Erdenet', 'Ulaanbaatar', 'Töv']
    const idx = parseInt(params.id as string) % 5 || 0
    return ok({
      ...respondent,
      gender: GENDERS[idx],
      age_group: AGE_GROUPS[idx],
      province: PROVINCES[idx],
    })
  }),

  http.get(`${API}/admin/respondents`, async ({ request }) => {
    await delay(250)
    return ok(adminDb.respondents)
  }),

  http.patch(`${API}/admin/respondents/:id/status`, async ({ params, request }) => {
    await delay(200)
    const body = (await request.json()) as { action: string }
    const resp = adminDb.respondents.find((r) => r.id === params.id)
    if (resp) {
      if (body.action === 'warn') { resp.status = 'warned'; resp.warning_count += 1 }
      else if (body.action === 'suspend') resp.status = 'suspended'
      else if (body.action === 'unsuspend') resp.status = 'active'
    }
    return ok(resp ?? null)
  }),

  http.get(`${API}/admin/surveys/:id/responses`, async ({ params }) => {
    await delay(200)
    const survey = adminDb.allSurveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)
    const MN_NAMES = ['Батаа', 'Мөнхбат', 'Оюунбаяр', 'Дулмаа', 'Энхтүвшин', 'Ганбаатар', 'Номин', 'Нарандэлгэр']
    const qualities: Array<'high' | 'medium' | 'low'> = ['high', 'high', 'medium', 'low']
    const statuses: Array<'earned' | 'pending' | 'invalidated'> = ['earned', 'earned', 'pending', 'invalidated']
    const now = Date.now()
    const count = Math.min(survey.current_responses, 8)
    const responses = Array.from({ length: count }, (_, i) => ({
      id: `adminresp-${survey.id}-${i}`,
      respondent_name: MN_NAMES[i % MN_NAMES.length]!,
      quality: qualities[i % qualities.length]!,
      status: statuses[i % statuses.length]!,
      submitted_at: new Date(now - i * 3600000 * 3).toISOString(),
    }))
    return ok(responses)
  }),

  http.get(`${API}/admin/surveys/:id`, async ({ params }) => {
    await delay(250)
    const survey = adminDb.allSurveys.find((s) => s.id === params.id)
    if (!survey) return err('NOT_FOUND', 'Survey not found', 404)
    const company = adminDb.companies[0]!
    return ok({
      ...survey,
      description: 'This survey collects participant feedback on product preferences and market behavior.',
      company_id: company.id,
      is_anonymous: true,
      est_minutes: Math.floor(Math.random() * 10) + 5,
      questions_count: Math.floor(Math.random() * 8) + 4,
      budget_spent: survey.current_responses * survey.reward_amount,
      avg_completion_rate: Math.floor(Math.random() * 30) + 60,
      ends_at: new Date(Date.now() + Math.floor(Math.random() * 30) * 86400000).toISOString(),
    })
  }),

  http.get(`${API}/admin/surveys`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    let surveys = [...adminDb.allSurveys]
    if (status) surveys = surveys.filter((s) => s.status === status)
    return ok(surveys)
  }),

  http.patch(`${API}/admin/surveys/:id/moderate`, async ({ params, request }) => {
    await delay(200)
    const body = (await request.json()) as { action: string }
    const survey = adminDb.allSurveys.find((s) => s.id === params.id)
    if (survey) {
      if (body.action === 'pause') survey.status = 'paused'
      else if (body.action === 'resume') survey.status = 'active'
      else if (body.action === 'reject') survey.status = 'rejected'
    }
    return ok(survey ?? null)
  }),

  http.get(`${API}/admin/payouts`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    let payouts = [...adminDb.payouts]
    if (status) payouts = payouts.filter((p) => p.status === status)
    return ok(payouts)
  }),

  http.get(`${API}/admin/payouts/stats`, async () => {
    await delay(150)
    const pending = adminDb.payouts.filter((p) => p.status === 'pending')
    const completedToday = adminDb.payouts.filter((p) => p.status === 'completed')
    return ok({
      total_pending: pending.length,
      total_pending_amount: pending.reduce((sum, p) => sum + p.amount, 0),
      released_today: completedToday.length,
      released_today_amount: completedToday.reduce((sum, p) => sum + p.amount, 0),
    })
  }),

  http.post(`${API}/admin/payouts/batch`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { ids: string[]; action: 'approve' | 'reject' }
    body.ids.forEach((id) => {
      const payout = adminDb.payouts.find((p) => p.id === id)
      if (payout) {
        payout.status = body.action === 'approve' ? 'completed' : 'failed'
      }
    })
    return ok({ processed: body.ids.length })
  }),

  http.get(`${API}/admin/fraud/:id`, async ({ params }) => {
    await delay(200)
    const alert = adminDb.fraudAlerts.find((a) => a.id === params.id)
    if (!alert) return err('NOT_FOUND', 'Alert not found', 404)
    const respondent = adminDb.respondents.find((r) => r.id === alert.respondent_id)
    const survey = adminDb.allSurveys.find((s) => s.id === alert.survey_id)
    const company = adminDb.companies[0]!
    return ok({
      ...alert,
      respondent_email: respondent?.email ?? 'unknown@example.mn',
      respondent_trust_level: respondent?.trust_level ?? 1,
      company_name: survey?.company_name ?? company.company_name,
      ip_address: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device_fingerprint: `fp_${Math.random().toString(36).slice(2, 12)}`,
    })
  }),

  http.get(`${API}/admin/fraud`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const severity = url.searchParams.get('severity')
    const status = url.searchParams.get('status')
    let alerts = [...adminDb.fraudAlerts]
    if (severity) alerts = alerts.filter((a) => a.severity === severity)
    if (status) alerts = alerts.filter((a) => a.status === status)
    return ok(alerts)
  }),

  http.get(`${API}/admin/fraud/stats`, async () => {
    await delay(150)
    return ok({
      open_alerts: adminDb.fraudAlerts.filter((a) => a.status === 'open').length,
      high_severity: adminDb.fraudAlerts.filter((a) => a.severity === 'high').length,
      banned_today: adminDb.fraudAlerts.filter((a) => a.status === 'banned').length,
      dismissed_today: adminDb.fraudAlerts.filter((a) => a.status === 'dismissed').length,
    })
  }),

  http.patch(`${API}/admin/fraud/:id/action`, async ({ params, request }) => {
    await delay(300)
    const body = (await request.json()) as { action: string }
    const alert = adminDb.fraudAlerts.find((a) => a.id === params.id)
    if (alert) {
      if (body.action === 'investigate') alert.status = 'investigating'
      else if (body.action === 'dismiss') alert.status = 'dismissed'
      else if (body.action === 'ban') alert.status = 'banned'
    }
    return ok(alert ?? null)
  }),
]
