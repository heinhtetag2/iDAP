import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, Users, Shield, HelpCircle } from 'lucide-react'
import { Button, Card, CardContent, Badge, Skeleton, Spinner } from '@/shared/ui'
import { formatCurrency } from '@/shared/lib'
import { useSurveyDetail, useStartSurvey } from '@/entities/survey'
import type { QuestionType } from '@/entities/survey'
import { ROUTES } from '@/shared/config/routes'

export default function SurveyDetailPage() {
  const { t } = useTranslation('survey')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: survey, isLoading } = useSurveyDetail(id!)
  const startSurvey = useStartSurvey()

  const handleStart = async () => {
    if (!id) return
    await startSurvey.mutateAsync(id)
    navigate(ROUTES.SURVEY_PLAYER(id))
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-secondary">Survey not found</p>
      </div>
    )
  }

  // Count question types
  const typeCounts = survey.questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1
    return acc
  }, {})

  const typeLabels: Record<QuestionType, string> = {
    single_choice: 'Single Choice',
    multi_choice: 'Multi Choice',
    text: 'Free Text',
    rating: 'Rating',
    scale: 'Scale',
    ranking: 'Ranking',
    matrix: 'Matrix',
    date: 'Date',
  }

  const remainingSpots = survey.max_responses - survey.current_responses

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        {tc('back')}
      </Button>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <img
            src={survey.company.logo_url}
            alt={survey.company.name}
            className="h-10 w-10 rounded-full"
          />
          <div>
            <p className="text-sm text-text-secondary">{survey.company.name}</p>
            <h1 className="text-xl font-bold text-text-primary">{survey.title}</h1>
          </div>
        </div>

        <p className="text-sm text-text-secondary leading-relaxed">{survey.description}</p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          <Badge>{t(`categories.${survey.category}`)}</Badge>
          {survey.is_anonymous && (
            <Badge variant="secondary">
              <Shield className="h-3 w-3 mr-1" />
              Anonymous
            </Badge>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-text-muted mb-1">{t('reward')}</p>
            <p className="text-lg font-bold text-primary-600">{formatCurrency(survey.reward_amount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-text-muted mb-1">{t('estimatedTime')}</p>
            <p className="text-lg font-bold text-text-primary flex items-center justify-center gap-1">
              <Clock className="h-4 w-4" />
              {survey.estimated_minutes} min
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-text-muted mb-1">{t('remainingSpots')}</p>
            <p className="text-lg font-bold text-text-primary flex items-center justify-center gap-1">
              <Users className="h-4 w-4" />
              {remainingSpots}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-text-muted mb-1">{t('questions')}</p>
            <p className="text-lg font-bold text-text-primary flex items-center justify-center gap-1">
              <HelpCircle className="h-4 w-4" />
              {survey.questions.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Question breakdown */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-text-primary mb-3">Question Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">
                  {typeLabels[type as QuestionType] ?? type}
                </span>
                <Badge variant="outline">{count}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Start button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleStart}
        loading={startSurvey.isPending}
      >
        {t('start')}
      </Button>
    </div>
  )
}
