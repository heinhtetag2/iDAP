import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Star, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Button,
  Badge,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/shared/ui'
import { cn } from '@/shared/lib'
import { useSurveyDetail, useSubmitSurvey } from '@/entities/survey'
import type { Question, QuestionOption } from '@/entities/survey'
import { ROUTES } from '@/shared/config/routes'
import { useBehaviorMeta } from '@/shared/hooks/useBehaviorMeta'

// Stable per-session shuffle using Fisher-Yates seeded by question id
function shuffleArray<T>(arr: T[], seed: string): T[] {
  const copy = [...arr]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0
  for (let i = copy.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) | 0
    const j = Math.abs(h) % (i + 1)
    ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
  }
  return copy
}

export default function SurveyPlayerPage() {
  const { t } = useTranslation('survey')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { data: survey, isLoading } = useSurveyDetail(id!)
  const submitSurvey = useSubmitSurvey()
  const { collect, trackQuestionTime } = useBehaviorMeta()

  const DRAFT_KEY = `survey-draft-${id}`

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, unknown>>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) return new Map(JSON.parse(saved) as [string, unknown][])
    } catch { /* ignore */ }
    return new Map()
  })
  const [exitOpen, setExitOpen] = useState(false)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const minTimeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const questions = survey?.questions ?? []
  const question = questions[currentIndex]
  const total = questions.length
  const progress = total > 0 ? ((currentIndex + 1) / total) * 100 : 0

  // Randomize option order per question, stable within session
  const shuffledOptions = useMemo(() => {
    const map = new Map<string, QuestionOption[]>()
    for (const q of questions) {
      if (q.options && (q.type === 'single_choice' || q.type === 'multi_choice')) {
        map.set(q.id, shuffleArray(q.options, q.id + (id ?? '')))
      } else if (q.options) {
        map.set(q.id, q.options)
      }
    }
    return map
  }, [questions, id])

  // Enforce min_response_ms per question
  useEffect(() => {
    setMinTimeElapsed(false)
    if (minTimeTimer.current) clearTimeout(minTimeTimer.current)
    const ms = (question as Question & { min_response_ms?: number })?.min_response_ms ?? 0
    if (ms <= 0) {
      setMinTimeElapsed(true)
      return
    }
    minTimeTimer.current = setTimeout(() => setMinTimeElapsed(true), ms)
    return () => { if (minTimeTimer.current) clearTimeout(minTimeTimer.current) }
  }, [currentIndex, question?.id])

  const setAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => {
      const next = new Map(prev)
      next.set(questionId, value)
      // Auto-save to localStorage
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(Array.from(next.entries())))
      } catch { /* ignore */ }
      return next
    })
  }, [DRAFT_KEY])

  const handleNext = () => {
    if (question) trackQuestionTime(question.id)
    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1)
  }

  const handleBack = () => {
    if (question) trackQuestionTime(question.id)
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const handleSubmit = async () => {
    if (!id || !question) return
    trackQuestionTime(question.id)
    const answerPayload = Array.from(answers.entries()).map(([question_id, answer_value]) => ({
      question_id,
      answer_value,
    }))
    const result = await submitSurvey.mutateAsync({
      surveyId: id,
      answers: answerPayload,
      behaviorMeta: collect(),
    })
    // Clear draft after successful submit
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    navigate(ROUTES.SURVEY_COMPLETE(id), { state: { result } })
  }

  const handleExit = () => {
    // Clear draft on exit
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    navigate(ROUTES.FEED)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-secondary">No questions found</p>
      </div>
    )
  }

  const currentAnswer = answers.get(question.id)
  const isLastQuestion = currentIndex === total - 1
  const nextDisabled = !minTimeElapsed

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => setExitOpen(true)}
            className="rounded-lg p-2 hover:bg-surface-secondary transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
          <span className="text-sm font-medium text-text-secondary">
            {t('progressLabel', { current: currentIndex + 1, total })}
          </span>
          <div className="w-9" />
        </div>
        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-200 mt-3 rounded-full max-w-2xl mx-auto">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-text-primary">{question.title}</h2>
            {question.description && (
              <p className="text-sm text-text-secondary">{question.description}</p>
            )}
            {question.is_required && (
              <Badge variant="danger" className="text-xs">
                {tc('required')}
              </Badge>
            )}
          </div>

          <QuestionRenderer
            question={question}
            answer={currentAnswer}
            shuffledOptions={shuffledOptions.get(question.id)}
            onAnswer={(value) => setAnswer(question.id, value)}
          />
        </div>
      </div>

      {/* Bottom nav */}
      <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-4">
        <div className="flex justify-between max-w-2xl mx-auto">
          <Button variant="outline" onClick={handleBack} disabled={currentIndex === 0}>
            {tc('back')}
          </Button>
          {isLastQuestion ? (
            <Button onClick={handleSubmit} loading={submitSurvey.isPending} disabled={nextDisabled}>
              {tc('submit')}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={nextDisabled}>
              {tc('next')}
            </Button>
          )}
        </div>
      </div>

      {/* Exit confirmation */}
      <Modal open={exitOpen} onOpenChange={setExitOpen}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t('confirmExit')}</ModalTitle>
            <ModalDescription>{t('confirmExitDesc')}</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <Button variant="outline" onClick={() => setExitOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button variant="danger" onClick={handleExit}>
              {tc('confirm')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

// ── Question Renderer ──────────────────────────────────

function QuestionRenderer({
  question,
  answer,
  shuffledOptions,
  onAnswer,
}: {
  question: Question
  answer: unknown
  shuffledOptions?: QuestionOption[]
  onAnswer: (value: unknown) => void
}) {
  const opts = shuffledOptions ?? question.options
  switch (question.type) {
    case 'single_choice':
      return <SingleChoice question={{ ...question, options: opts }} answer={answer as string} onAnswer={onAnswer} />
    case 'multi_choice':
      return <MultiChoice question={{ ...question, options: opts }} answer={answer as string[]} onAnswer={onAnswer} />
    case 'text':
      return <TextAnswer answer={answer as string} onAnswer={onAnswer} />
    case 'rating':
      return <RatingAnswer answer={answer as number} onAnswer={onAnswer} />
    case 'scale':
      return <ScaleAnswer answer={answer as number} onAnswer={onAnswer} />
    case 'ranking':
      return <RankingAnswer question={question} answer={answer as string[]} onAnswer={onAnswer} />
    case 'matrix':
      return <MatrixAnswer question={question} answer={answer as Record<string, string>} onAnswer={onAnswer} />
    case 'date':
      return <DateAnswer answer={answer as string} onAnswer={onAnswer} />
    default:
      return <TextAnswer answer={answer as string} onAnswer={onAnswer} />
  }
}

// ── Single Choice ──────────────────────────────────────

function SingleChoice({
  question,
  answer,
  onAnswer,
}: {
  question: Question
  answer: string | undefined
  onAnswer: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      {question.options?.map((opt) => (
        <label
          key={opt.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
            answer === opt.id
              ? 'border-primary-600 bg-primary-50'
              : 'border-border hover:bg-surface-secondary',
          )}
        >
          <input
            type="radio"
            name={question.id}
            value={opt.id}
            checked={answer === opt.id}
            onChange={() => onAnswer(opt.id)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-text-primary">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}

// ── Multi Choice ───────────────────────────────────────

function MultiChoice({
  question,
  answer,
  onAnswer,
}: {
  question: Question
  answer: string[] | undefined
  onAnswer: (v: string[]) => void
}) {
  const selected = answer ?? []
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onAnswer(selected.filter((s) => s !== id))
    } else {
      onAnswer([...selected, id])
    }
  }

  return (
    <div className="space-y-2">
      {question.options?.map((opt) => (
        <label
          key={opt.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
            selected.includes(opt.id)
              ? 'border-primary-600 bg-primary-50'
              : 'border-border hover:bg-surface-secondary',
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(opt.id)}
            onChange={() => toggle(opt.id)}
            className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-text-primary">{opt.label}</span>
        </label>
      ))}
    </div>
  )
}

// ── Text ───────────────────────────────────────────────

function TextAnswer({
  answer,
  onAnswer,
}: {
  answer: string | undefined
  onAnswer: (v: string) => void
}) {
  return (
    <textarea
      value={answer ?? ''}
      onChange={(e) => onAnswer(e.target.value)}
      rows={4}
      placeholder="Type your answer..."
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 resize-none"
    />
  )
}

// ── Rating ─────────────────────────────────────────────

function RatingAnswer({
  answer,
  onAnswer,
}: {
  answer: number | undefined
  onAnswer: (v: number) => void
}) {
  return (
    <div className="flex gap-2 justify-center py-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onAnswer(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              'h-10 w-10 transition-colors',
              answer && star <= answer
                ? 'fill-warning-500 text-warning-500'
                : 'text-gray-300',
            )}
          />
        </button>
      ))}
    </div>
  )
}

// ── Scale ──────────────────────────────────────────────

function ScaleAnswer({
  answer,
  onAnswer,
}: {
  answer: number | undefined
  onAnswer: (v: number) => void
}) {
  return (
    <div className="space-y-4 py-4">
      <input
        type="range"
        min={1}
        max={10}
        value={answer ?? 5}
        onChange={(e) => onAnswer(Number(e.target.value))}
        className="w-full accent-primary-600"
      />
      <div className="flex justify-between text-xs text-text-muted">
        <span>1</span>
        <span className="text-lg font-bold text-primary-600">{answer ?? 5}</span>
        <span>10</span>
      </div>
    </div>
  )
}

// ── Ranking (dnd-kit) ──────────────────────────────────

function SortableItem({ id, label, index }: { id: string; label: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-surface p-3 select-none',
        isDragging ? 'shadow-lg border-primary-400 opacity-90 z-50' : 'border-border',
      )}
    >
      <span className="text-xs font-bold text-text-muted w-5 text-center">{index + 1}</span>
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-text-muted hover:text-text-primary"
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm text-text-primary flex-1">{label}</span>
    </div>
  )
}

function RankingAnswer({
  question,
  answer,
  onAnswer,
}: {
  question: Question
  answer: string[] | undefined
  onAnswer: (v: string[]) => void
}) {
  const options = question.options ?? []
  const order: string[] = answer ?? options.map((o) => o.id)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = order.indexOf(String(active.id))
      const newIndex = order.indexOf(String(over.id))
      onAnswer(arrayMove(order, oldIndex, newIndex))
    }
  }

  const labelMap = Object.fromEntries(options.map((o) => [o.id, o.label]))

  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted mb-3">Drag to reorder by preference</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map((id, index) => (
            <SortableItem key={id} id={id} label={labelMap[id] ?? id} index={index} />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  )
}

// ── Matrix ─────────────────────────────────────────────

function MatrixAnswer({
  question,
  answer,
  onAnswer,
}: {
  question: Question
  answer: Record<string, string> | undefined
  onAnswer: (v: Record<string, string>) => void
}) {
  const rows = (question as Question & { rows?: QuestionOption[] }).rows ?? []
  const cols = question.options ?? []
  const selected = answer ?? {}

  const select = (rowId: string, colId: string) => {
    onAnswer({ ...selected, [rowId]: colId })
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[420px] text-sm border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="text-left pb-3 pr-3 font-medium text-text-secondary w-1/3" />
            {cols.map((col) => (
              <th
                key={col.id}
                className="pb-3 px-1 font-medium text-text-secondary text-center text-xs leading-tight"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={row.id}
              className={cn('border-t border-border', ri % 2 === 0 ? 'bg-surface' : 'bg-surface-secondary')}
            >
              <td className="py-3 pr-3 text-text-primary leading-snug">{row.label}</td>
              {cols.map((col) => (
                <td key={col.id} className="py-3 px-1 text-center">
                  <button
                    type="button"
                    onClick={() => select(row.id, col.id)}
                    className={cn(
                      'mx-auto flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                      selected[row.id] === col.id
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300 hover:border-primary-400',
                    )}
                  >
                    {selected[row.id] === col.id && (
                      <span className="block h-2 w-2 rounded-full bg-white" />
                    )}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Date ───────────────────────────────────────────────

function DateAnswer({
  answer,
  onAnswer,
}: {
  answer: string | undefined
  onAnswer: (v: string) => void
}) {
  return (
    <div className="py-2">
      <input
        type="date"
        value={answer ?? ''}
        onChange={(e) => onAnswer(e.target.value)}
        max={new Date().toISOString().split('T')[0]}
        className="flex h-10 w-full max-w-xs rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      />
    </div>
  )
}
