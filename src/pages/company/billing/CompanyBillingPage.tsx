import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, TrendingDown, Zap, Building2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/shared/lib'
import { apiClient } from '@/shared/api/client'
import { useCompanyAuthStore } from '@/shared/model/companyAuthStore'

interface BillingTx {
  id: string
  type: 'purchase' | 'spent'
  amount: number
  note: string
  created_at: string
}

const PACKAGES = [
  { label: 'Starter', amount: 100_000, bonus: 0, color: 'border-gray-200', badge: '' },
  { label: 'Popular', amount: 500_000, bonus: 50_000, color: 'border-indigo-400 ring-2 ring-indigo-100', badge: 'Most Popular' },
  { label: 'Growth', amount: 1_000_000, bonus: 150_000, color: 'border-border', badge: '15% bonus' },
  { label: 'Enterprise', amount: 5_000_000, bonus: 1_000_000, color: 'border-border', badge: '20% bonus' },
]

const GATEWAYS = [
  { id: 'qpay', label: 'QPay', icon: '📱' },
  { id: 'social_pay', label: 'Social Pay', icon: '💳' },
  { id: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
]

export default function CompanyBillingPage() {
  const { user, setUser } = useCompanyAuthStore()
  const queryClient = useQueryClient()
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null)
  const [gateway, setGateway] = useState('qpay')
  const [purchased, setPurchased] = useState(false)

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
    starter: ['Up to 5 active surveys', '500 responses/month', 'Basic analytics', 'Email support'],
    growth: ['Up to 20 active surveys', '5,000 responses/month', 'Advanced analytics', 'Priority support', 'Demographic targeting'],
    enterprise: ['Unlimited surveys', 'Unlimited responses', 'Full analytics suite', 'Dedicated account manager', 'Custom integrations', 'SLA guarantee'],
  }

  return (
    <div className="space-y-6 max-w-4xl">
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
                user?.plan === 'growth' ? 'bg-indigo-300/20 text-indigo-200' :
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
                <p className="text-xs text-success-600 mt-0.5 flex items-center gap-1">
                  <Zap className="h-3 w-3" />+₮{(pkg.bonus / 1000).toLocaleString()}K bonus
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Gateway */}
        <div className="flex items-center gap-3 mb-4">
          {GATEWAYS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGateway(g.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                gateway === g.id ? 'border-indigo-400 bg-indigo-50 text-indigo-700' : 'border-border text-text-secondary hover:border-gray-300'
              )}
            >
              <span>{g.icon}</span> {g.label}
            </button>
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
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-text-primary">Transaction History</h2>
        </div>
        <div className="divide-y divide-border">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                tx.type === 'purchase' ? 'bg-success-50' : 'bg-gray-100'
              )}>
                {tx.type === 'purchase'
                  ? <Zap className="h-4 w-4 text-success-600" />
                  : <TrendingDown className="h-4 w-4 text-text-muted" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{tx.note}</p>
                <p className="text-xs text-text-muted">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <p className={cn('text-sm font-semibold', tx.type === 'purchase' ? 'text-success-600' : 'text-text-secondary')}>
                {tx.type === 'purchase' ? '+' : '-'}₮{tx.amount.toLocaleString()}
              </p>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-text-muted">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
