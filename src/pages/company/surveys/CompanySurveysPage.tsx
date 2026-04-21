import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { PlusCircle, Search, MoreVertical, Edit2, Pause, Play, Trash2, CheckCircle2, PauseCircle, Circle, Clock } from 'lucide-react'
import { cn } from '@/shared/lib'
import { Tooltip } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { ROUTES } from '@/shared/config/routes'
import { formatDistanceToNow } from 'date-fns'

interface Survey {
  id: string
  title: string
  category: string
  status: 'active' | 'paused' | 'completed' | 'draft'
  current_responses: number
  max_responses: number
  reward_amount: number
  estimated_minutes: number
  ends_at: string
  created_at: string
}

const FILTER_TABS = ['all', 'active', 'paused', 'completed', 'draft'] as const

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    active: 'bg-success-50 text-success-600 border-success-200',
    paused: 'bg-warning-50 text-warning-600 border-warning-200',
    completed: 'bg-gray-100 text-text-muted border-gray-200',
    draft: 'bg-blue-50 text-blue-600 border-blue-200',
  }
  return cn('px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize', map[status] ?? 'bg-gray-100 text-text-muted')
}

function SurveyRow({ survey, onAction }: { survey: Survey; onAction: (action: string, id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pct = Math.round((survey.current_responses / survey.max_responses) * 100)

  return (
    <tr className="border-b border-border hover:bg-gray-50 transition-colors group">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <Tooltip content={
              survey.status === 'active' ? 'Active — currently collecting responses.' :
              survey.status === 'paused' ? 'Paused — temporarily not accepting responses.' :
              survey.status === 'completed' ? 'Completed — reached maximum responses.' :
              'Draft — not yet published.'
            } position="bottom">
              <span>
                {survey.status === 'active' && <CheckCircle2 className="h-4 w-4 text-success-600" />}
                {survey.status === 'paused' && <PauseCircle className="h-4 w-4 text-warning-600" />}
                {(survey.status === 'completed' || survey.status === 'draft') && <Circle className="h-4 w-4 text-text-muted" />}
              </span>
            </Tooltip>
          </div>
          <div>
            <Link to={ROUTES.COMPANY_SURVEY_DETAIL(survey.id)} className="text-sm font-medium text-text-primary hover:text-indigo-600 transition-colors">{survey.title}</Link>
            <p className="text-xs text-text-muted capitalize">{survey.category.replace('_', ' ')}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={statusBadgeClass(survey.status)}>{survey.status}</span>
      </td>
      <td className="px-4 py-4">
        <Tooltip content={`${survey.current_responses} of ${survey.max_responses} responses collected (${pct}% full).`} position="bottom">
          <div className="flex items-center gap-2 cursor-default">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden w-20">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-text-secondary whitespace-nowrap">
              {survey.current_responses}/{survey.max_responses}
            </span>
          </div>
        </Tooltip>
      </td>
      <td className="px-4 py-4 text-sm text-text-primary font-medium">
        ₮{survey.reward_amount.toLocaleString()}
      </td>
      <td className="px-4 py-4 text-sm text-text-secondary">
        <Tooltip content={`Estimated completion time for respondents: ~${survey.estimated_minutes} minutes.`} position="bottom">
          <div className="flex items-center gap-1 cursor-default">
            <Clock className="h-3 w-3" />
            {survey.estimated_minutes}m
          </div>
        </Tooltip>
      </td>
      <td className="px-4 py-4 text-xs text-text-muted">
        {new Date(survey.ends_at) > new Date()
          ? formatDistanceToNow(new Date(survey.ends_at), { addSuffix: true })
          : 'Ended'}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip content="Edit this survey's questions, settings, and reward." position="bottom">
            <Link
              to={ROUTES.COMPANY_SURVEY_EDIT(survey.id)}
              className="p-1.5 rounded hover:bg-gray-200 text-text-muted hover:text-text-primary"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Link>
          </Tooltip>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded hover:bg-gray-200 text-text-muted"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-lg border border-border bg-white shadow-lg py-1 z-20">
                {survey.status === 'active' ? (
                  <button onClick={() => { onAction('pause', survey.id); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-50 text-warning-600">
                    <Pause className="h-3.5 w-3.5" />Pause
                  </button>
                ) : survey.status === 'paused' ? (
                  <button onClick={() => { onAction('resume', survey.id); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-gray-50 text-success-600">
                    <Play className="h-3.5 w-3.5" />Resume
                  </button>
                ) : null}
                <button onClick={() => { onAction('delete', survey.id); setMenuOpen(false) }}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-danger-50 text-danger-600">
                  <Trash2 className="h-3.5 w-3.5" />Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function CompanySurveysPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<typeof FILTER_TABS[number]>('all')
  const [search, setSearch] = useState('')

  const { data: surveys = [], isLoading } = useQuery<Survey[]>({
    queryKey: ['company', 'surveys'],
    queryFn: async () => {
      const { data } = await apiClient.get('/company/surveys')
      return data as Survey[]
    },
  })

  const actionMutation = useMutation({
    mutationFn: async ({ action, id }: { action: string; id: string }) => {
      if (action === 'delete') await apiClient.delete(`/company/surveys/${id}`)
      else await apiClient.patch(`/company/surveys/${id}/status`, { status: action === 'pause' ? 'paused' : 'active' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['company', 'surveys'] }),
  })

  const filtered = surveys.filter((s) => {
    const matchFilter = filter === 'all' || s.status === filter
    const matchSearch = s.title.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Surveys</h1>
          <p className="text-sm text-text-secondary mt-0.5">{surveys.length} total surveys</p>
        </div>
        <button
          onClick={() => navigate(ROUTES.COMPANY_SURVEY_NEW)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors shadow-sm"
        >
          <PlusCircle className="h-4 w-4" />
          New Survey
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex rounded-lg border border-border bg-white p-1 gap-0.5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors',
                filter === tab ? 'bg-indigo-600 text-white' : 'text-text-secondary hover:bg-gray-50'
              )}
            >
              {tab}
              {tab !== 'all' && (
                <span className="ml-1.5 text-xs opacity-60">
                  {surveys.filter((s) => s.status === tab).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search surveys…"
            className="h-9 w-56 rounded-lg border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-gray-50">
                <th className="px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Survey</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Responses</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Reward</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Length</th>
                <th className="px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Ends</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-4 rounded bg-gray-100 animate-pulse w-full" />
                    </td>
                  </tr>
                ))
              )}
              {!isLoading && filtered.map((s) => (
                <SurveyRow
                  key={s.id}
                  survey={s}
                  onAction={(action, id) => actionMutation.mutate({ action, id })}
                />
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-text-muted">
                    No surveys found.{' '}
                    <Link to={ROUTES.COMPANY_SURVEY_NEW} className="text-indigo-600 hover:underline">
                      Create one →
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
