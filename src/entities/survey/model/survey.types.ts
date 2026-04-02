export type QuestionType =
  | 'single_choice'
  | 'multi_choice'
  | 'text'
  | 'rating'
  | 'scale'
  | 'ranking'
  | 'matrix'
  | 'date'

export type SurveyCategory =
  | 'market_research'
  | 'brand'
  | 'product'
  | 'hr'
  | 'social'
  | 'other'

export type SurveyStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'completed'
  | 'rejected'

export interface QuestionOption {
  id: string
  label: string
}

export interface Question {
  id: string
  survey_id: string
  order_index: number
  type: QuestionType
  title: string
  description?: string
  is_required: boolean
  options?: QuestionOption[]
  rows?: QuestionOption[]
  min_response_ms: number
}

export interface SurveyCompany {
  name: string
  logo_url: string
}

export interface Survey {
  id: string
  company_id: string
  title: string
  description: string
  category: SurveyCategory
  status: SurveyStatus
  reward_amount: number
  max_responses: number
  current_responses: number
  estimated_minutes: number
  starts_at: string
  ends_at: string
  is_anonymous: boolean
  company: SurveyCompany
  match_score: number
  questions: Question[]
  created_at: string
  trust_level_required: number
}

export interface SurveyFeedItem extends Omit<Survey, 'questions'> {
  remaining_spots: number
  is_free: boolean
}

export interface SubmitResult {
  response_id: string
  status: 'completed' | 'pending_review' | 'invalidated'
  quality_score: number
  reward: {
    amount: number
    status: 'granted' | 'pending' | 'invalidated'
    wallet_balance_after: number
  }
}
