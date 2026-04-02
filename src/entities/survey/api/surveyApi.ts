import { apiClient } from '@/shared/api'
import type { Survey, SurveyFeedItem, Question, SubmitResult } from '../model/survey.types'

interface FeedParams {
  cursor?: string
  limit?: number
  category?: string
  sort?: string
}

export async function fetchSurveyFeed(params: FeedParams = {}): Promise<{
  items: SurveyFeedItem[]
  cursor?: string
  has_next: boolean
}> {
  const { data, meta } = await apiClient.get('/respondent/surveys', { params })
  return {
    items: data as SurveyFeedItem[],
    cursor: meta?.cursor ?? undefined,
    has_next: meta?.has_next ?? false,
  }
}

export async function fetchSurveyById(id: string): Promise<Survey> {
  const { data } = await apiClient.get(`/respondent/surveys/${id}`)
  return data as Survey
}

export async function fetchSurveyQuestions(id: string): Promise<Question[]> {
  const { data } = await apiClient.get(`/respondent/surveys/${id}/questions`)
  return data as Question[]
}

export async function startSurvey(id: string): Promise<{ response_id: string; questions: Question[] }> {
  const { data } = await apiClient.post(`/respondent/surveys/${id}/start`)
  return data as { response_id: string; questions: Question[] }
}

export async function submitSurvey(
  id: string,
  answers: { question_id: string; answer_value: unknown }[],
  behaviorMeta: Record<string, unknown>
): Promise<SubmitResult> {
  const { data } = await apiClient.post(`/respondent/surveys/${id}/submit`, {
    answers,
    behavior_meta: behaviorMeta,
  })
  return data as SubmitResult
}
