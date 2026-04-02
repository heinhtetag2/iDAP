import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Users, Clock, CheckCircle2, ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'

interface SurveyOption { id: string; title: string }

interface AnalyticsData {
  survey_id: string
  survey_title: string
  total_responses: number
  completion_rate: number
  avg_time_seconds: number
  quality_distribution: { label: string; count: number; color: string }[]
  daily_responses: { date: string; count: number }[]
  gender_breakdown: { label: string; pct: number; color: string }[]
  age_breakdown: { label: string; pct: number }[]
  province_breakdown: { label: string; count: number }[]
  drop_off: { question: string; remaining: number }[]
}

function BarChartHoriz({ data, max }: { data: { label: string; count: number }[]; max: number }) {
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-text-secondary w-28 shrink-0 truncate">{d.label}</span>
          <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-text-muted w-8 text-right shrink-0">{d.count}</span>
        </div>
      ))}
    </div>
  )
}

function DailyChart({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div>
      <div className="flex items-end gap-1 h-24">
        {data.map((d) => (
          <div key={d.date} className="flex flex-col items-center flex-1 group">
            <div className="relative flex-1 w-full flex items-end">
              <div
                className="w-full rounded-t bg-indigo-400 group-hover:bg-indigo-600 transition-colors cursor-default"
                style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
                title={`${d.count} responses`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5">
        {data.filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1).map((d) => (
          <span key={d.date} className="text-xs text-text-muted">{d.date}</span>
        ))}
      </div>
    </div>
  )
}

function DonutSegment({ pct, color, offset }: { pct: number; color: string; offset: number }) {
  const r = 40
  const circ = 2 * Math.PI * r
  return (
    <circle
      cx="50" cy="50" r={r}
      fill="none"
      stroke={color}
      strokeWidth="18"
      strokeDasharray={`${(pct / 100) * circ} ${circ}`}
      strokeDashoffset={-offset * circ / 100}
      transform="rotate(-90 50 50)"
    />
  )
}

function DonutChart({ data }: { data: { label: string; pct: number; color: string }[] }) {
  let offset = 0
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0">
        {data.map((d) => {
          const seg = <DonutSegment key={d.label} pct={d.pct} color={d.color} offset={offset} />
          offset += d.pct
          return seg
        })}
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-xs text-text-secondary">{d.label}</span>
            <span className="text-xs font-semibold text-text-primary ml-auto">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CompanyAnalyticsPage() {
  const [selectedId, setSelectedId] = useState<string>('')

  const { data: surveys = [] } = useQuery<SurveyOption[]>({
    queryKey: ['company', 'surveys', 'options'],
    queryFn: async () => {
      const { data } = await apiClient.get('/company/surveys?limit=50')
      const raw = data as { id: string; title: string }[]
      return raw.map((s) => ({ id: s.id, title: s.title }))
    },
  })

  useEffect(() => {
    if (surveys.length > 0 && !selectedId) setSelectedId(surveys[0]!.id)
  }, [surveys, selectedId])

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ['company', 'analytics', selectedId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/company/surveys/${selectedId}/analytics`)
      return data as AnalyticsData
    },
    enabled: !!selectedId,
  })

  const maxProvince = analytics ? Math.max(...analytics.province_breakdown.map((p) => p.count), 1) : 1

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
          <p className="text-sm text-text-secondary">Deep insights from your surveys</p>
        </div>

        {/* Survey selector */}
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-10 appearance-none rounded-xl border border-border bg-white px-4 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="">Select a survey…</option>
            {surveys.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {analytics && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Total Responses', value: analytics.total_responses.toLocaleString(), color: 'bg-indigo-500' },
              { icon: TrendingUp, label: 'Completion Rate', value: `${analytics.completion_rate}%`, color: 'bg-success-600' },
              { icon: Clock, label: 'Avg. Time', value: `${Math.round(analytics.avg_time_seconds / 60)}m ${analytics.avg_time_seconds % 60}s`, color: 'bg-warning-600' },
              { icon: CheckCircle2, label: 'Quality (avg)', value: analytics.quality_distribution[0]?.label ?? '—', color: 'bg-primary-600' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-white p-5">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg mb-3', s.color)}>
                  <s.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <p className="text-xl font-bold text-text-primary">{s.value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily responses */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-semibold text-text-primary mb-4">Daily Responses</h2>
              <DailyChart data={analytics.daily_responses} />
            </div>

            {/* Gender breakdown */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-semibold text-text-primary mb-4">Gender Breakdown</h2>
              <DonutChart data={analytics.gender_breakdown} />
            </div>

            {/* Province breakdown */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-semibold text-text-primary mb-4">Top Provinces</h2>
              <BarChartHoriz data={analytics.province_breakdown.slice(0, 8)} max={maxProvince} />
            </div>

            {/* Drop-off funnel */}
            <div className="rounded-xl border border-border bg-white p-5">
              <h2 className="font-semibold text-text-primary mb-4">Completion Funnel</h2>
              <div className="space-y-2">
                {analytics.drop_off.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-text-muted w-4 shrink-0">{i + 1}</span>
                    <span className="text-xs text-text-secondary flex-1 truncate">{d.question}</span>
                    <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', i === 0 ? 'bg-success-500' : 'bg-indigo-400')}
                        style={{ width: `${d.remaining}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-primary w-8 text-right">{d.remaining}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quality distribution */}
          <div className="rounded-xl border border-border bg-white p-5">
            <h2 className="font-semibold text-text-primary mb-4">Response Quality Distribution</h2>
            <div className="flex gap-3 h-20 items-end">
              {analytics.quality_distribution.map((d) => {
                const maxQ = Math.max(...analytics.quality_distribution.map((x) => x.count), 1)
                return (
                  <div key={d.label} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs text-text-muted">{d.count}</span>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{ height: `${Math.max((d.count / maxQ) * 80, 4)}%`, backgroundColor: d.color }}
                    />
                    <span className="text-xs text-text-secondary text-center leading-tight">{d.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {!selectedId && !isLoading && (
        <div className="rounded-xl border-2 border-dashed border-border p-16 text-center">
          <TrendingUp className="h-8 w-8 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary">Select a survey to view analytics</p>
        </div>
      )}
    </div>
  )
}
