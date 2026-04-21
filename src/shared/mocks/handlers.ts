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

    // ── Quality multiplier (spec §1.3.5) ─────────────
    let qualityMultiplier = 1.0
    if (qualityScore >= 90) qualityMultiplier = 1.2
    else if (qualityScore >= 85) qualityMultiplier = 1.1
    else if (qualityScore >= 80) qualityMultiplier = 1.0
    else if (qualityScore >= 75) qualityMultiplier = 0.9
    else qualityMultiplier = 0.8

    const adjustedReward = Math.round(survey.reward_amount * qualityMultiplier)
    const isInstant = qualityScore >= 80

    // ── Warning rules (spec §1.3.5) ──────────────────
    if (qualityScore < 20) {
      db.user.warning_count += 2 // suspend flag simulation
    } else if (qualityScore < 50) {
      db.user.warning_count += 1
    }

    // ── Update rolling avg quality & response count ──
    const prevCount = db.user.responses_count
    const prevAvg = db.user.avg_quality_score
    db.user.responses_count = prevCount + 1
    db.user.avg_quality_score = Math.round((prevAvg * prevCount + qualityScore) / (prevCount + 1))

    // ── Auto trust level upgrade (spec §1.3.4) ───────
    const TRUST_THRESHOLDS: Record<number, { min_responses: number; min_quality: number }> = {
      1: { min_responses: 5, min_quality: 70 },
      2: { min_responses: 20, min_quality: 75 },
      3: { min_responses: 50, min_quality: 80 },
      4: { min_responses: 100, min_quality: 85 },
    }
    const currentLevel = db.user.trust_level
    const threshold = TRUST_THRESHOLDS[currentLevel]
    let levelUpgraded = false
    if (threshold && currentLevel < 5 &&
        db.user.responses_count >= threshold.min_responses &&
        db.user.avg_quality_score >= threshold.min_quality) {
      db.user.trust_level = currentLevel + 1
      levelUpgraded = true
    }

    // ── Wallet ───────────────────────────────────────
    if (isInstant && survey.reward_amount > 0) {
      db.wallet.balance += adjustedReward
      db.wallet.total_earned += adjustedReward
      db.transactions.unshift({
        id: 'tx-' + Date.now(),
        type: 'earned',
        amount: adjustedReward,
        balance_after: db.wallet.balance,
        note: `${survey.title} — шагнал`,
        note_en: `${survey.title_en} — reward`,
        note_ko: `${survey.title_ko} — 보상`,
        created_at: new Date().toISOString(),
      })
    } else if (qualityScore >= 50 && survey.reward_amount > 0) {
      db.wallet.pending_balance += adjustedReward
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
      reward_amount: adjustedReward,
      reward_status: isInstant ? 'granted' : qualityScore >= 50 ? 'pending' : 'invalidated',
      completed_at: new Date().toISOString(),
    } as MockSurveyHistoryItem)

    return ok({
      response_id: 'resp-' + Date.now(),
      status: isInstant ? 'completed' : qualityScore >= 50 ? 'pending_review' : 'invalidated',
      quality_score: qualityScore,
      quality_multiplier: qualityMultiplier,
      level_upgraded: levelUpgraded,
      new_trust_level: db.user.trust_level,
      reward: {
        amount: adjustedReward,
        base_amount: survey.reward_amount,
        status: isInstant ? 'granted' : qualityScore >= 50 ? 'pending' : 'invalidated',
        wallet_balance_after: db.wallet.balance,
      },
    })
  }),

  // ── Trust Status ─────────────────────────────────

  http.get(`${API}/respondent/trust-status`, async () => {
    await delay(200)
    const TRUST_THRESHOLDS: Record<number, { min_responses: number; min_quality: number; label: string; color: string }> = {
      1: { min_responses: 5, min_quality: 70, label: 'New', color: 'gray' },
      2: { min_responses: 20, min_quality: 75, label: 'Verified', color: 'blue' },
      3: { min_responses: 50, min_quality: 80, label: 'Trusted', color: 'green' },
      4: { min_responses: 100, min_quality: 85, label: 'Premium', color: 'violet' },
      5: { min_responses: 9999, min_quality: 99, label: 'Partner', color: 'amber' },
    }
    const currentLevel = db.user.trust_level
    const nextThreshold = TRUST_THRESHOLDS[currentLevel]
    return ok({
      trust_level: currentLevel,
      trust_label: TRUST_THRESHOLDS[currentLevel]?.label ?? 'New',
      responses_count: db.user.responses_count,
      avg_quality_score: db.user.avg_quality_score,
      warning_count: db.user.warning_count,
      next_level: currentLevel < 5 ? currentLevel + 1 : null,
      next_level_label: currentLevel < 5 ? TRUST_THRESHOLDS[currentLevel + 1]?.label : null,
      next_threshold: nextThreshold ?? null,
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

  http.get(`${API}/company/surveys/:surveyId/responses/:responseId`, async ({ params }) => {
    await delay(200)
    const { surveyId, responseId } = params as { surveyId: string; responseId: string }
    const idx = parseInt(responseId.split('-').pop() ?? '0', 10)
    const MN_NAMES = ['Батаа', 'Мөнхбат', 'Оюунбаяр', 'Дулмаа', 'Энхтүвшин', 'Ганбаатар', 'Номин', 'Нарандэлгэр']
    const qualities: Array<'high' | 'medium' | 'low'> = ['high', 'high', 'medium', 'low']
    const statuses: Array<'earned' | 'pending' | 'invalidated'> = ['earned', 'earned', 'pending', 'invalidated']
    const quality = qualities[idx % qualities.length]!
    const score = quality === 'high' ? 82 + (idx % 14) : quality === 'medium' ? 62 + (idx % 12) : 38 + (idx % 18)
    const multiplier = score >= 80 ? 1.2 : score >= 65 ? 1.0 : 0.5
    const rewardBase = 5000
    const QUESTIONS = [
      { q: 'Which mobile banking app do you use most frequently?', type: 'single_choice', answers: ['Khan Bank', 'TDB Digital', 'Golomt Bank', 'XacBank', 'Other'] },
      { q: 'How often do you make digital payments per week?', type: 'scale', answers: ['1–2 times', '3–5 times', '6–10 times', '10+ times'] },
      { q: 'What is your primary reason for using digital payments?', type: 'single_choice', answers: ['Convenience', 'Speed', 'Rewards', 'No cash available', 'Safety'] },
      { q: 'Rate your overall satisfaction with your current banking app.', type: 'scale', answers: ['1', '2', '3', '4', '5'] },
      { q: 'Which features do you use most? (Select all that apply)', type: 'multiple_choice', answers: ['Transfers', 'Bill payment', 'QR payment', 'Investment', 'Loans'] },
      { q: 'How likely are you to recommend your bank to a friend?', type: 'scale', answers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { q: 'What improvement would most increase your satisfaction?', type: 'text', answers: ['Better UI', 'Faster transactions', 'Lower fees', 'More features', 'Better support'] },
    ]
    const answers = QUESTIONS.map((q, qi) => {
      const timeSec = quality === 'high' ? 8 + qi * 4 + (idx % 5) : quality === 'medium' ? 4 + qi * 2 : 1 + qi
      const flagged = quality === 'low' && qi % 3 === 0
      return {
        question_number: qi + 1,
        question_text: q.q,
        question_type: q.type,
        answer: q.answers[(idx + qi) % q.answers.length]!,
        time_seconds: timeSec,
        flagged,
        flag_reason: flagged ? (timeSec < 3 ? 'Answered too fast (< 3s)' : 'Pattern matches straight-lining') : undefined,
      }
    })
    const qualityFactors = [
      { name: 'Response speed', passed: quality !== 'low', penalty: quality === 'low' ? -20 : 0, note: quality === 'low' ? 'Avg 1.8s/question (below 3s threshold)' : `Avg ${quality === 'high' ? '12.4' : '6.1'}s/question — normal` },
      { name: 'Straight-lining', passed: quality !== 'low', penalty: quality === 'low' ? -35 : 0, note: quality === 'low' ? '5 consecutive identical answers detected' : 'No straight-lining detected' },
      { name: 'Attention check', passed: quality === 'high', penalty: quality === 'medium' ? -10 : quality === 'low' ? -50 : 0, note: quality === 'high' ? 'Passed all attention checks' : quality === 'medium' ? 'Missed 1 of 2 attention checks' : 'Failed attention check' },
      { name: 'Position bias', passed: quality !== 'low', penalty: quality === 'low' ? -20 : 0, note: quality === 'low' ? 'First option selected >70% of questions' : 'Answer distribution looks natural' },
      { name: 'Tab visibility', passed: true, penalty: 0, note: 'Stayed on tab throughout survey' },
    ]
    return ok({
      id: responseId,
      respondent_name: MN_NAMES[idx % MN_NAMES.length]!,
      quality,
      quality_score: score,
      status: statuses[idx % statuses.length]!,
      submitted_at: new Date(Date.now() - idx * 3600000 * 2).toISOString(),
      time_taken_seconds: answers.reduce((s, a) => s + a.time_seconds, 0),
      reward_base: rewardBase,
      multiplier,
      reward_earned: Math.round(rewardBase * multiplier),
      quality_factors: qualityFactors,
      answers,
    })
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

  http.get(`${API}/company/billing/transactions/:txId`, async ({ params }) => {
    await delay(250)
    const tx = companyDb.billingTxns.find((t) => t.id === params.txId)
    if (!tx) return new Response(null, { status: 404 })

    const GATEWAYS = ['QPay', 'Social Pay', 'Bank Transfer']
    const PACKAGES: Record<number, { label: string; bonus: number }> = {
      100000:  { label: 'Starter',    bonus: 0       },
      500000:  { label: 'Popular',    bonus: 50000   },
      1000000: { label: 'Growth',     bonus: 150000  },
      5000000: { label: 'Enterprise', bonus: 1000000 },
    }
    const idx = parseInt((tx.id.split('-').pop() ?? '1'), 10)
    const gateway = GATEWAYS[idx % GATEWAYS.length]!
    const balanceBefore = 250000 + idx * 17300
    const balanceAfter  = tx.type === 'purchase' ? balanceBefore + tx.amount : balanceBefore - tx.amount

    const detail = tx.type === 'purchase'
      ? {
          ...tx,
          package_label:  PACKAGES[tx.amount]?.label ?? 'Custom',
          base_amount:    PACKAGES[tx.amount] ? tx.amount - (PACKAGES[tx.amount]?.bonus ?? 0) : tx.amount,
          bonus_amount:   PACKAGES[tx.amount]?.bonus ?? 0,
          gateway,
          reference:      `TXN-${tx.id.toUpperCase()}-${idx}`,
          status:         'completed',
          balance_before: balanceBefore,
          balance_after:  balanceAfter,
        }
      : {
          ...tx,
          survey_name:        tx.note.replace('Survey spend — ', ''),
          responses_paid:     Math.max(1, Math.round(tx.amount / 1000)),
          amount_per_response: 1000,
          platform_fee:       Math.round(tx.amount * 0.1),
          respondent_payout:  Math.round(tx.amount * 0.9),
          gateway:            null,
          reference:          `SPEND-${tx.id.toUpperCase()}`,
          status:             'completed',
          balance_before:     balanceBefore,
          balance_after:      balanceAfter,
        }

    return ok(detail)
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

  http.put(`${API}/company/settings/password`, async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { current_password: string; new_password: string }
    if (!body.current_password || !body.new_password) {
      return err('VALIDATION_ERROR', 'All fields required')
    }
    return ok({ message: 'Password updated successfully' })
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

  http.get(`${API}/admin/companies/:id/billing`, async ({ params }) => {
    await delay(200)
    const company = adminDb.companies.find((c) => c.id === params.id)
    if (!company) return err('NOT_FOUND', 'Company not found', 404)
    const rr = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
    const types = ['credit_purchase', 'survey_spend', 'credit_purchase', 'survey_spend', 'survey_spend', 'refund'] as const
    const now = Date.now()
    const txns = Array.from({ length: 12 }, (_, i) => {
      const type = types[i % types.length]!
      const amount = type === 'credit_purchase' ? rr(5, 50) * 10000 : type === 'refund' ? rr(1, 5) * 1000 : rr(1, 20) * 1000
      return {
        id: `btx-${params.id}-${i}`,
        type,
        amount,
        description: type === 'credit_purchase' ? 'Credits purchased' : type === 'refund' ? 'Survey refund' : 'Survey reward spend',
        created_at: new Date(now - i * rr(1, 5) * 86400000).toISOString(),
      }
    })
    return ok({ credits_balance: company.credits_balance, total_spent: company.total_spent, transactions: txns })
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
    const SURVEY_TITLES_EN = [
      'Consumer Preferences Study', 'Brand Awareness Survey', 'Product Feedback',
      'User Experience Research', 'Market Analysis', 'Digital Habits Survey',
      'Financial Behavior Study', 'Healthcare Opinions Survey', 'Retail Satisfaction',
      'Social Media Usage Survey',
    ]
    const REWARD_AMOUNTS = [0, 1000, 2000, 3000, 5000, 10000, 15000]
    const qualities: Array<'high' | 'medium' | 'low'> = ['high', 'high', 'medium', 'low']
    const statuses: Array<'earned' | 'pending' | 'invalidated'> = ['earned', 'earned', 'earned', 'pending', 'invalidated']
    const now = Date.now()
    const count = Math.min(respondent.surveys_completed, 10)
    const history = Array.from({ length: count }, (_, i) => {
      const quality = qualities[i % qualities.length]!
      const rewardStatus = statuses[i % statuses.length]!
      const baseReward = REWARD_AMOUNTS[i % REWARD_AMOUNTS.length]!
      const rr = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
      const qualityScore = quality === 'high' ? rr(85, 99) : quality === 'medium' ? rr(65, 84) : rr(30, 64)
      const surveyRef = adminDb.allSurveys[i % adminDb.allSurveys.length]!
      return {
        id: `hist-${respondent.id}-${i}`,
        survey_id: surveyRef.id,
        survey_title: SURVEY_TITLES_EN[i % SURVEY_TITLES_EN.length]!,
        quality,
        quality_score: qualityScore,
        reward_amount: rewardStatus === 'earned' ? baseReward : rewardStatus === 'pending' ? baseReward : 0,
        reward_status: rewardStatus,
        submitted_at: new Date(now - i * 86400000 * rr(1, 3)).toISOString(),
      }
    })
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
      else if (body.action === 'unsuspend' || body.action === 'reinstate') { resp.status = 'active'; resp.warning_count = 0 }
      else if (body.action === 'clear_warnings') { resp.status = 'active'; resp.warning_count = 0 }
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
      respondent_id: `resp-${(i % adminDb.respondents.length) + 1}`,
      respondent_name: MN_NAMES[i % MN_NAMES.length]!,
      quality: qualities[i % qualities.length]!,
      status: statuses[i % statuses.length]!,
      submitted_at: new Date(now - i * 3600000 * 3).toISOString(),
    }))
    return ok(responses)
  }),

  http.get(`${API}/admin/surveys/:surveyId/responses/:responseId`, async ({ params }) => {
    await delay(200)
    const { responseId } = params as { surveyId: string; responseId: string }
    const idx = parseInt(responseId.split('-').pop() ?? '0', 10)
    const MN_NAMES = ['Батаа', 'Мөнхбат', 'Оюунбаяр', 'Дулмаа', 'Энхтүвшин', 'Ганбаатар', 'Номин', 'Нарандэлгэр']
    const qualities: Array<'high' | 'medium' | 'low'> = ['high', 'high', 'medium', 'low']
    const statuses: Array<'earned' | 'pending' | 'invalidated'> = ['earned', 'earned', 'pending', 'invalidated']
    const quality = qualities[idx % qualities.length]!
    const score = quality === 'high' ? 82 + (idx % 14) : quality === 'medium' ? 62 + (idx % 12) : 38 + (idx % 18)
    const multiplier = score >= 80 ? 1.2 : score >= 65 ? 1.0 : 0.5
    const rewardBase = 5000
    const QUESTIONS = [
      { q: 'Which mobile banking app do you use most frequently?', type: 'single_choice', answers: ['Khan Bank', 'TDB Digital', 'Golomt Bank', 'XacBank', 'Other'] },
      { q: 'How often do you make digital payments per week?', type: 'scale', answers: ['1–2 times', '3–5 times', '6–10 times', '10+ times'] },
      { q: 'What is your primary reason for using digital payments?', type: 'single_choice', answers: ['Convenience', 'Speed', 'Rewards', 'No cash available', 'Safety'] },
      { q: 'Rate your overall satisfaction with your current banking app.', type: 'scale', answers: ['1', '2', '3', '4', '5'] },
      { q: 'Which features do you use most? (Select all that apply)', type: 'multiple_choice', answers: ['Transfers', 'Bill payment', 'QR payment', 'Investment', 'Loans'] },
      { q: 'How likely are you to recommend your bank to a friend?', type: 'scale', answers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
      { q: 'What improvement would most increase your satisfaction?', type: 'text', answers: ['Better UI', 'Faster transactions', 'Lower fees', 'More features', 'Better support'] },
    ]
    const answers = QUESTIONS.map((q, qi) => {
      const timeSec = quality === 'high' ? 8 + qi * 4 + (idx % 5) : quality === 'medium' ? 4 + qi * 2 : 1 + qi
      const flagged = quality === 'low' && qi % 3 === 0
      return {
        question_number: qi + 1,
        question_text: q.q,
        question_type: q.type,
        answer: q.answers[(idx + qi) % q.answers.length]!,
        time_seconds: timeSec,
        flagged,
        flag_reason: flagged ? (timeSec < 3 ? 'Answered too fast (< 3s)' : 'Pattern matches straight-lining') : undefined,
      }
    })
    const qualityFactors = [
      { name: 'Response speed', passed: quality !== 'low', penalty: quality === 'low' ? -20 : 0, note: quality === 'low' ? 'Avg 1.8s/question (below 3s threshold)' : `Avg ${quality === 'high' ? '12.4' : '6.1'}s/question — normal` },
      { name: 'Straight-lining', passed: quality !== 'low', penalty: quality === 'low' ? -35 : 0, note: quality === 'low' ? '5 consecutive identical answers detected' : 'No straight-lining detected' },
      { name: 'Attention check', passed: quality === 'high', penalty: quality === 'medium' ? -10 : quality === 'low' ? -50 : 0, note: quality === 'high' ? 'Passed all attention checks' : quality === 'medium' ? 'Missed 1 of 2 attention checks' : 'Failed attention check' },
      { name: 'Position bias', passed: quality !== 'low', penalty: quality === 'low' ? -20 : 0, note: quality === 'low' ? 'First option selected >70% of questions' : 'Answer distribution looks natural' },
      { name: 'Tab visibility', passed: true, penalty: 0, note: 'Stayed on tab throughout survey' },
    ]
    return ok({
      id: responseId,
      respondent_name: MN_NAMES[idx % MN_NAMES.length]!,
      quality,
      quality_score: score,
      status: statuses[idx % statuses.length]!,
      submitted_at: new Date(Date.now() - idx * 3600000 * 3).toISOString(),
      time_taken_seconds: answers.reduce((s, a) => s + a.time_seconds, 0),
      reward_base: rewardBase,
      multiplier,
      reward_earned: Math.round(rewardBase * multiplier),
      quality_factors: qualityFactors,
      answers,
    })
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

  // ══════════════════════════════════════════════════
  // COMPANY NOTIFICATIONS
  // ══════════════════════════════════════════════════

  http.get(`${API}/company/notifications/unread-count`, async () => {
    await delay(100)
    const unread = companyDb.notifications.filter((n: Record<string, unknown>) => !n.read).length
    return ok({ unread })
  }),

  http.get(`${API}/company/notifications`, async () => {
    await delay(250)
    return ok(companyDb.notifications)
  }),

  http.patch(`${API}/company/notifications/:id/read`, async ({ params }) => {
    await delay(100)
    const n = companyDb.notifications.find((n: Record<string, unknown>) => n.id === params.id)
    if (n) n.read = true
    return ok(n ?? null)
  }),

  http.patch(`${API}/company/notifications/read-all`, async () => {
    await delay(150)
    companyDb.notifications.forEach((n: Record<string, unknown>) => { n.read = true })
    return ok(null)
  }),

  http.delete(`${API}/company/notifications/:id`, async ({ params }) => {
    await delay(100)
    const idx = companyDb.notifications.findIndex((n: Record<string, unknown>) => n.id === params.id)
    if (idx !== -1) companyDb.notifications.splice(idx, 1)
    return ok(null)
  }),

  // ══════════════════════════════════════════════════
  // ADMIN NOTIFICATIONS
  // ══════════════════════════════════════════════════

  http.get(`${API}/admin/notifications/unread-count`, async () => {
    await delay(100)
    const unread = adminDb.notifications.filter((n: Record<string, unknown>) => !n.read).length
    return ok({ unread })
  }),

  http.get(`${API}/admin/notifications`, async () => {
    await delay(250)
    return ok(adminDb.notifications)
  }),

  http.patch(`${API}/admin/notifications/:id/read`, async ({ params }) => {
    await delay(100)
    const n = adminDb.notifications.find((n: Record<string, unknown>) => n.id === params.id)
    if (n) n.read = true
    return ok(n ?? null)
  }),

  http.patch(`${API}/admin/notifications/read-all`, async () => {
    await delay(150)
    adminDb.notifications.forEach((n: Record<string, unknown>) => { n.read = true })
    return ok(null)
  }),

  http.delete(`${API}/admin/notifications/:id`, async ({ params }) => {
    await delay(100)
    const idx = adminDb.notifications.findIndex((n: Record<string, unknown>) => n.id === params.id)
    if (idx !== -1) adminDb.notifications.splice(idx, 1)
    return ok(null)
  }),

  // ══════════════════════════════════════════════════
  // ADMIN SETTINGS
  // ══════════════════════════════════════════════════

  http.get(`${API}/admin/settings`, async () => {
    await delay(200)
    return ok({
      full_name: adminDb.user.full_name,
      email: adminDb.user.email,
      admin_role: adminDb.user.admin_role,
      notifications: adminDb.settings.notifications,
      security: adminDb.settings.security,
    })
  }),

  http.put(`${API}/admin/settings`, async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Record<string, unknown>
    if (body.full_name) adminDb.user.full_name = body.full_name as string
    if (body.email) adminDb.user.email = body.email as string
    if (body.notifications) adminDb.settings.notifications = body.notifications as typeof adminDb.settings.notifications
    if (body.security) adminDb.settings.security = { ...adminDb.settings.security, ...(body.security as object) }
    return ok(null)
  }),
]
