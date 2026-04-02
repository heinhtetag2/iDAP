import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/config/queryKeys'
import { fetchSurveyFeed, fetchSurveyById, startSurvey, submitSurvey } from '../api/surveyApi'

export function useSurveyFeed(filters?: { category?: string; sort?: string }) {
  return useInfiniteQuery({
    queryKey: queryKeys.surveys.feed(filters),
    queryFn: ({ pageParam }) =>
      fetchSurveyFeed({ cursor: pageParam as string | undefined, limit: 20, ...filters }),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.cursor : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: 3 * 60 * 1000,
  })
}

export function useSurveyDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.surveys.detail(id),
    queryFn: () => fetchSurveyById(id),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
  })
}

export function useStartSurvey() {
  return useMutation({
    mutationFn: (surveyId: string) => startSurvey(surveyId),
  })
}

export function useSubmitSurvey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      surveyId,
      answers,
      behaviorMeta,
    }: {
      surveyId: string
      answers: { question_id: string; answer_value: unknown }[]
      behaviorMeta: Record<string, unknown>
    }) => submitSurvey(surveyId, answers, behaviorMeta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys', 'feed'] })
      queryClient.invalidateQueries({ queryKey: ['wallet'] })
    },
  })
}
