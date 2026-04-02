import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusCircle, Trash2, GripVertical, ChevronDown, ChevronUp, ArrowLeft, Save, Send } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'

const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multi_choice', label: 'Multiple Choice' },
  { value: 'text', label: 'Open Text' },
  { value: 'rating', label: 'Rating (1–5)' },
  { value: 'scale', label: 'Scale (1–10)' },
  { value: 'ranking', label: 'Ranking' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'date', label: 'Date' },
] as const

const CATEGORIES = [
  'market_research', 'brand', 'product', 'hr', 'social', 'other'
] as const

const TRUST_LEVELS = [1, 2, 3, 4, 5] as const

interface Question {
  id: string
  type: string
  title: string
  is_required: boolean
  options: string[]
}

interface SurveyForm {
  title: string
  description: string
  category: string
  reward_amount: number
  max_responses: number
  estimated_minutes: number
  ends_at: string
  trust_level_required: number
  is_anonymous: boolean
  questions: Question[]
}

function QuestionCard({
  q,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  q: Question
  index: number
  total: number
  onChange: (updated: Question) => void
  onRemove: () => void
  onMove: (dir: 'up' | 'down') => void
}) {
  const [open, setOpen] = useState(true)
  const needsOptions = ['single_choice', 'multi_choice', 'ranking'].includes(q.type)

  return (
    <div className="rounded-xl border border-border bg-white">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <GripVertical className="h-4 w-4 text-text-muted shrink-0" />
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 shrink-0">
          {index + 1}
        </span>
        <span className="flex-1 text-sm font-medium text-text-primary truncate">
          {q.title || `Question ${index + 1}`}
        </span>
        <span className="text-xs text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">
          {QUESTION_TYPES.find((t) => t.value === q.type)?.label}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); onMove('up') }} disabled={index === 0}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onMove('down') }} disabled={index === total - 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-30">
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1 rounded hover:bg-danger-50 text-danger-600">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-secondary mb-1">Question text</label>
              <input
                value={q.title}
                onChange={(e) => onChange({ ...q, title: e.target.value })}
                placeholder="Enter your question…"
                className="h-9 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
              <select
                value={q.type}
                onChange={(e) => onChange({ ...q, type: e.target.value, options: [] })}
                className="h-9 w-full rounded-lg border border-border px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {needsOptions && (
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Options</label>
              <div className="space-y-1.5">
                {q.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => {
                        const updated = [...q.options]
                        updated[i] = e.target.value
                        onChange({ ...q, options: updated })
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="h-8 flex-1 rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={() => onChange({ ...q, options: q.options.filter((_, j) => j !== i) })}
                      className="p-1.5 rounded hover:bg-danger-50 text-danger-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => onChange({ ...q, options: [...q.options, ''] })}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 mt-1"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add option
                </button>
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={q.is_required}
              onChange={(e) => onChange({ ...q, is_required: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-xs text-text-secondary">Required question</span>
          </label>
        </div>
      )}
    </div>
  )
}

let qCounter = 0
function newQuestion(): Question {
  return { id: `q-${++qCounter}`, type: 'single_choice', title: '', is_required: true, options: ['', ''] }
}

export default function CompanySurveyBuilderPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<SurveyForm>({
    title: '',
    description: '',
    category: 'market_research',
    reward_amount: 500,
    max_responses: 100,
    estimated_minutes: 5,
    ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!,
    trust_level_required: 1,
    is_anonymous: false,
    questions: [newQuestion()],
  })

  const saveMutation = useMutation({
    mutationFn: async (asDraft: boolean) => {
      const payload = { ...form, status: asDraft ? 'draft' : 'active' }
      await apiClient.post('/company/surveys', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'surveys'] })
      navigate(ROUTES.COMPANY_SURVEYS)
    },
  })

  const set = (field: keyof SurveyForm, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const updateQuestion = (index: number, updated: Question) =>
    setForm((prev) => {
      const qs = [...prev.questions]
      qs[index] = updated
      return { ...prev, questions: qs }
    })

  const removeQuestion = (index: number) =>
    setForm((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }))

  const moveQuestion = (index: number, dir: 'up' | 'down') =>
    setForm((prev) => {
      const qs = [...prev.questions]
      const target = dir === 'up' ? index - 1 : index + 1
      ;[qs[index], qs[target]] = [qs[target]!, qs[index]!]
      return { ...prev, questions: qs }
    })

  const labelClass = 'block text-sm font-medium text-text-secondary mb-1.5'
  const inputClass = 'h-10 w-full rounded-lg border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(ROUTES.COMPANY_SURVEYS)}
          className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold text-text-primary">Survey Builder</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => saveMutation.mutate(true)}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary hover:bg-gray-50"
          >
            <Save className="h-4 w-4" /> Save Draft
          </button>
          <button
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending || !form.title || form.questions.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white transition-colors"
          >
            <Send className="h-4 w-4" /> Publish Survey
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Settings */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-text-primary">Survey Settings</h2>

            <div>
              <label className={labelClass}>Title *</label>
              <input value={form.title} onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Customer Satisfaction 2025"
                className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                rows={3} placeholder="Tell respondents what this survey is about…"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>

            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-text-primary">Reward & Limits</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Reward (₮)</label>
                <input type="number" value={form.reward_amount} min={100}
                  onChange={(e) => set('reward_amount', parseInt(e.target.value))}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Max Responses</label>
                <input type="number" value={form.max_responses} min={10}
                  onChange={(e) => set('max_responses', parseInt(e.target.value))}
                  className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Est. Minutes</label>
                <input type="number" value={form.estimated_minutes} min={1}
                  onChange={(e) => set('estimated_minutes', parseInt(e.target.value))}
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Min Trust Level</label>
                <select value={form.trust_level_required}
                  onChange={(e) => set('trust_level_required', parseInt(e.target.value))}
                  className={inputClass}>
                  {TRUST_LEVELS.map((l) => <option key={l} value={l}>Level {l}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>End Date</label>
              <input type="date" value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
                className={inputClass} />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_anonymous}
                onChange={(e) => set('is_anonymous', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
              <span className="text-sm text-text-secondary">Anonymous responses</span>
            </label>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm">
            <p className="font-medium text-indigo-700 mb-1">Estimated Cost</p>
            <p className="text-indigo-600 text-xl font-bold">
              ₮{(form.reward_amount * form.max_responses).toLocaleString()}
            </p>
            <p className="text-xs text-indigo-400 mt-1">
              {form.max_responses} responses × ₮{form.reward_amount.toLocaleString()} each
            </p>
          </div>
        </div>

        {/* Right: Questions */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-text-primary">Questions ({form.questions.length})</h2>
          </div>

          {form.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              q={q}
              index={i}
              total={form.questions.length}
              onChange={(updated) => updateQuestion(i, updated)}
              onRemove={() => removeQuestion(i)}
              onMove={(dir) => moveQuestion(i, dir)}
            />
          ))}

          <button
            onClick={() => setForm((prev) => ({ ...prev, questions: [...prev.questions, newQuestion()] }))}
            className={cn(
              'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border',
              'py-4 text-sm font-medium text-text-muted hover:border-indigo-400 hover:text-indigo-600 transition-colors'
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Add Question
          </button>
        </div>
      </div>
    </div>
  )
}
