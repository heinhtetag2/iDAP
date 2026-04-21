import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCard, TrendingDown, Zap, Building2, CheckCircle2,
  ArrowDownLeft, ArrowUpRight, Receipt, Hash, Wallet,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/shared/lib'
import { Tooltip, SlidePanel } from '@/shared/ui'
import { apiClient } from '@/shared/api/client'
import { useCompanyAuthStore } from '@/shared/model/companyAuthStore'
import { format } from 'date-fns'

interface BillingTx {
  id: string
  type: 'purchase' | 'spent'
  amount: number
  note: string
  created_at: string
}

interface TxDetail extends BillingTx {
  // common
  reference: string
  status: 'completed' | 'pending' | 'failed'
  balance_before: number
  balance_after: number
  gateway: string | null
  // purchase-only
  package_label?: string
  base_amount?: number
  bonus_amount?: number
  // spent-only
  survey_name?: string
  responses_paid?: number
  amount_per_response?: number
  platform_fee?: number
  respondent_payout?: number
}

const PACKAGES = [
  { label: 'Starter',    amount: 100_000,   bonus: 0,         color: 'border-gray-200',                          badge: '' },
  { label: 'Popular',    amount: 500_000,   bonus: 50_000,    color: 'border-indigo-400 ring-2 ring-indigo-100', badge: 'Most Popular' },
  { label: 'Growth',     amount: 1_000_000, bonus: 150_000,   color: 'border-border',                            badge: '15% bonus' },
  { label: 'Enterprise', amount: 5_000_000, bonus: 1_000_000, color: 'border-border',                            badge: '20% bonus' },
]

const GATEWAYS = [
  { id: 'qpay',          label: 'QPay',          icon: '📱' },
  { id: 'social_pay',    label: 'Social Pay',    icon: '💳' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
]

// ── Transaction detail panel ──────────────────────────────────────────────────
function TxDetailPanel({ txId }: { txId: string }) {
  const { data, isLoading } = useQuery<TxDetail>({
    queryKey: ['company', 'billing', 'transactions', txId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/company/billing/transactions/${txId}`)
      return data as TxDetail
    },
  })

  if (isLoading) {
    return (
      <div className="p-5 space-y-4 animate-pulse">
        <div className="h-24 rounded-xl bg-gray-100" />
        <div className="h-36 rounded-xl bg-gray-100" />
        <div className="h-28 rounded-xl bg-gray-100" />
      </div>
    )
  }
  if (!data) return null

  const isPurchase = data.type === 'purchase'

  return (
    <div className="p-5 space-y-5">

      {/* Hero amount */}
      <div className={cn(
        'rounded-xl p-5 flex items-center gap-4',
        isPurchase ? 'bg-success-50 border border-success-200' : 'bg-gray-50 border border-border',
      )}>
        <div className={cn(
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
          isPurchase ? 'bg-success-100' : 'bg-gray-200',
        )}>
          {isPurchase
            ? <ArrowDownLeft className="h-6 w-6 text-success-600" />
            : <ArrowUpRight  className="h-6 w-6 text-text-muted" />}
        </div>
        <div>
          <p className={cn('text-2xl font-bold', isPurchase ? 'text-success-700' : 'text-text-primary')}>
            {isPurchase ? '+' : '-'}₮{data.amount.toLocaleString()}
          </p>
          <p className="text-sm text-text-secondary mt-0.5">{data.note}</p>
          <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-success-100 text-success-700 text-[11px] font-semibold uppercase tracking-wide">
            <CheckCircle2 className="h-3 w-3" /> {data.status}
          </span>
        </div>
      </div>

      {/* Reference + date */}
      <div className="rounded-xl border border-border divide-y divide-border">
        {[
          { icon: Hash,     label: 'Reference',  value: data.reference },
          { icon: Receipt,  label: 'Date',        value: format(new Date(data.created_at), 'MMM d, yyyy · HH:mm') },
          ...(data.gateway ? [{ icon: CreditCard, label: 'Payment via', value: data.gateway }] : []),
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-text-muted">
              <Icon className="h-4 w-4" />
              {label}
            </div>
            <span className="font-medium text-text-primary text-right max-w-[180px] truncate">{value}</span>
          </div>
        ))}
      </div>

      {/* Purchase breakdown */}
      {isPurchase && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Credit Breakdown</p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-text-muted">Package</span>
              <span className="font-semibold text-indigo-700">{data.package_label}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-text-muted">Base credits</span>
              <span className="font-medium text-text-primary">₮{(data.base_amount ?? 0).toLocaleString()}</span>
            </div>
            {(data.bonus_amount ?? 0) > 0 && (
              <div className="flex justify-between items-center px-4 py-3 text-sm">
                <span className="text-text-muted flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-success-600" /> Bonus credits
                </span>
                <span className="font-medium text-success-600">+₮{(data.bonus_amount ?? 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center px-4 py-3 text-sm bg-success-50/50">
              <span className="font-semibold text-text-primary">Total received</span>
              <span className="font-bold text-success-700">₮{data.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Spend breakdown */}
      {!isPurchase && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-border">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Spend Breakdown</p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-text-muted">Survey</span>
              <span className="font-medium text-text-primary text-right max-w-[200px] truncate">{data.survey_name}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-text-muted">Responses paid</span>
              <span className="font-medium text-text-primary">{data.responses_paid} × ₮{(data.amount_per_response ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-text-muted">Respondent payouts</span>
              <span className="font-medium text-text-primary">₮{(data.respondent_payout ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm">
              <span className="text-text-muted">Platform fee (10%)</span>
              <span className="font-medium text-text-primary">₮{(data.platform_fee ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 text-sm bg-gray-50/70">
              <span className="font-semibold text-text-primary">Total deducted</span>
              <span className="font-bold text-text-primary">₮{data.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Balance before / after */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide flex items-center gap-1.5">
            <Wallet className="h-3.5 w-3.5" /> Balance impact
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex-1 text-center">
            <p className="text-xs text-text-muted mb-1">Before</p>
            <p className="text-base font-bold text-text-primary">₮{data.balance_before.toLocaleString()}</p>
          </div>
          <div className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
            isPurchase ? 'bg-success-100' : 'bg-red-50',
          )}>
            <ChevronRight className={cn('h-4 w-4', isPurchase ? 'text-success-600' : 'text-red-400')} />
          </div>
          <div className="flex-1 text-center">
            <p className="text-xs text-text-muted mb-1">After</p>
            <p className={cn('text-base font-bold', isPurchase ? 'text-success-700' : 'text-text-primary')}>
              ₮{data.balance_after.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CompanyBillingPage() {
  const { user, setUser } = useCompanyAuthStore()
  const queryClient = useQueryClient()
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null)
  const [gateway, setGateway] = useState('qpay')
  const [purchased, setPurchased] = useState(false)
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)

  const { data: transactions = [] } = useQuery<BillingTx[]>({
    queryKey: ['company', 'billing', 'transactions'],
    queryFn: async () => {
      const { data } = await apiClient.get('/company/billing/transactions')
      return data as BillingTx[]
    },
  })

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (selectedPkg === null) return
      const pkg = PACKAGES[selectedPkg]!
      await apiClient.post('/company/billing/purchase', {
        amount: pkg.amount + pkg.bonus,
        gateway,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', 'billing'] })
      if (selectedPkg !== null && user) {
        const pkg = PACKAGES[selectedPkg]!
        setUser({ ...user, credits_balance: user.credits_balance + pkg.amount + pkg.bonus })
      }
      setPurchased(true)
      setTimeout(() => { setPurchased(false); setSelectedPkg(null) }, 3000)
    },
  })

  const planFeatures: Record<string, string[]> = {
    starter:    ['Up to 5 active surveys', '500 responses/month', 'Basic analytics', 'Email support'],
    growth:     ['Up to 20 active surveys', '5,000 responses/month', 'Advanced analytics', 'Priority support', 'Demographic targeting'],
    enterprise: ['Unlimited surveys', 'Unlimited responses', 'Full analytics suite', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'],
  }

  const selectedTx = transactions.find((t) => t.id === selectedTxId) ?? null

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Billing & Credits</h1>
        <p className="text-sm text-text-secondary mt-0.5">Manage your credits and view transaction history</p>
      </div>

      {/* Balance card */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-indigo-200 text-sm">Available Credits</p>
            <p className="text-4xl font-bold mt-1">₮{(user?.credits_balance ?? 0).toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={cn(
                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
                user?.plan === 'enterprise' ? 'bg-yellow-400/20 text-yellow-300' :
                user?.plan === 'growth'     ? 'bg-indigo-300/20 text-indigo-200' :
                                              'bg-white/10 text-white/70'
              )}>
                <Building2 className="h-3 w-3" />
                {user?.plan?.toUpperCase()} plan
              </span>
            </div>
          </div>
          <CreditCard className="h-10 w-10 text-indigo-300 opacity-60" />
        </div>
      </div>

      {/* Credit packages */}
      <div className="rounded-xl border border-border bg-white p-5">
        <h2 className="font-semibold text-text-primary mb-4">Top Up Credits</h2>

        {purchased && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-success-50 border border-success-200 px-4 py-3 text-success-600 text-sm">
            <CheckCircle2 className="h-5 w-5" />
            Credits added successfully!
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {PACKAGES.map((pkg, i) => (
            <button
              key={pkg.label}
              onClick={() => setSelectedPkg(i)}
              className={cn(
                'relative rounded-xl border-2 p-4 text-left transition-all',
                selectedPkg === i ? 'border-indigo-500 bg-indigo-50' : pkg.color + ' bg-white hover:border-indigo-300'
              )}
            >
              {pkg.badge && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {pkg.badge}
                </span>
              )}
              <p className="text-sm font-semibold text-text-primary">{pkg.label}</p>
              <p className="text-xl font-bold text-indigo-700 mt-1">₮{(pkg.amount / 1000).toLocaleString()}K</p>
              {pkg.bonus > 0 && (
                <Tooltip content={`Free bonus credits — you get ₮${(pkg.amount + pkg.bonus).toLocaleString()} total for ₮${pkg.amount.toLocaleString()}.`} position="bottom">
                  <p className="text-xs text-success-600 mt-0.5 flex items-center gap-1 cursor-default">
                    <Zap className="h-3 w-3" />+₮{(pkg.bonus / 1000).toLocaleString()}K bonus
                  </p>
                </Tooltip>
              )}
            </button>
          ))}
        </div>

        {/* Gateway */}
        <div className="flex items-center gap-3 mb-4">
          {GATEWAYS.map((g) => (
            <Tooltip
              key={g.id}
              content={
                g.id === 'qpay'          ? "QPay — Mongolia's most widely used mobile payment gateway. Instant credit." :
                g.id === 'social_pay'    ? 'Social Pay — pay via Khan Bank or Golomt social banking app.' :
                                           'Bank Transfer — direct bank transfer. Credits added after confirmation (1–2 business days).'
              }
              position="bottom"
            >
              <button
                onClick={() => setGateway(g.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  gateway === g.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-border text-text-secondary hover:border-gray-300'
                )}
              >
                <span>{g.icon}</span> {g.label}
              </button>
            </Tooltip>
          ))}
        </div>

        <button
          onClick={() => purchaseMutation.mutate()}
          disabled={selectedPkg === null || purchaseMutation.isPending}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 px-6 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {purchaseMutation.isPending ? 'Processing…' : selectedPkg !== null
            ? `Purchase ₮${((PACKAGES[selectedPkg]!.amount + PACKAGES[selectedPkg]!.bonus) / 1000).toLocaleString()}K`
            : 'Select a package'}
        </button>
      </div>

      {/* Plan features */}
      {user?.plan && (
        <div className="rounded-xl border border-border bg-white p-5">
          <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-600" />
            Your Plan — {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(planFeatures[user.plan] ?? []).map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                <CheckCircle2 className="h-4 w-4 text-success-600 shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <a href="mailto:sales@idap.mn" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
            Upgrade plan →
          </a>
        </div>
      )}

      {/* Transaction history */}
      <div className="rounded-xl border border-border bg-white">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-text-primary">Transaction History</h2>
          <p className="text-xs text-text-muted">Click a row for details</p>
        </div>
        <div className="divide-y divide-border">
          {transactions.map((tx) => (
            <button
              key={tx.id}
              onClick={() => setSelectedTxId(tx.id)}
              className={cn(
                'w-full flex items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-gray-50',
                selectedTxId === tx.id && 'bg-indigo-50',
              )}
            >
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                tx.type === 'purchase' ? 'bg-success-50' : 'bg-gray-100'
              )}>
                {tx.type === 'purchase'
                  ? <Zap className="h-4 w-4 text-success-600" />
                  : <TrendingDown className="h-4 w-4 text-text-muted" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{tx.note}</p>
                <p className="text-xs text-text-muted">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <p className={cn('text-sm font-semibold shrink-0', tx.type === 'purchase' ? 'text-success-600' : 'text-text-secondary')}>
                {tx.type === 'purchase' ? '+' : '-'}₮{tx.amount.toLocaleString()}
              </p>
              <ChevronRight className="h-4 w-4 text-text-muted shrink-0" />
            </button>
          ))}
          {transactions.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-text-muted">No transactions yet</p>
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedTx && (
        <SlidePanel
          isOpen={!!selectedTxId}
          onClose={() => setSelectedTxId(null)}
          title={selectedTx.type === 'purchase' ? 'Credit Purchase' : 'Survey Spend'}
          subtitle={
            <p className="text-xs text-text-muted">
              {new Date(selectedTx.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          }
        >
          <TxDetailPanel txId={selectedTx.id} />
        </SlidePanel>
      )}
    </div>
  )
}
