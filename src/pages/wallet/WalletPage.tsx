import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  Wallet,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  Skeleton,
  EmptyState,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  Input,
} from '@/shared/ui'
import { cn, formatCurrency, formatRelativeTime } from '@/shared/lib'
import { useWallet, useTransactions, useWithdraw } from '@/entities/wallet'
import { fetchWithdrawalStatus } from '@/entities/wallet/api/walletApi'
import type { WithdrawRequest, Transaction } from '@/entities/wallet'
import { ROUTES } from '@/shared/config/routes'
import { MIN_WITHDRAWAL_AMOUNT, QUICK_WITHDRAWAL_AMOUNTS } from '@/shared/config/constants'
import { queryKeys } from '@/shared/config/queryKeys'

type WithdrawStep = 'form' | 'processing' | 'result'
type Gateway = 'qpay' | 'bonum'

export default function WalletPage() {
  const { t } = useTranslation('wallet')
  const { t: tc } = useTranslation('common')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: wallet, isLoading: walletLoading } = useWallet()
  const { data: txData, isLoading: txLoading } = useTransactions()
  const withdrawMutation = useWithdraw()

  const [modalOpen, setModalOpen] = useState(false)
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('form')
  const [gateway, setGateway] = useState<Gateway>('qpay')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [withdrawResult, setWithdrawResult] = useState<{ success: boolean; autoRefund?: boolean } | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const recentTxns: Transaction[] =
    txData?.pages.flatMap((p) => p.items).slice(0, 5) ?? []

  const openModal = () => {
    setWithdrawStep('form')
    setWithdrawAmount('')
    setGateway('qpay')
    setBankName('')
    setAccountNumber('')
    setPhoneNumber('')
    setWithdrawResult(null)
    setModalOpen(true)
  }

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => () => stopPolling(), [])

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount)
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT) return

    const accountInfo = gateway === 'qpay'
      ? { bank: bankName, account_number: accountNumber }
      : { phone: phoneNumber }

    if (gateway === 'qpay' && (!bankName || !accountNumber)) return
    if (gateway === 'bonum' && !phoneNumber) return

    setWithdrawStep('processing')

    try {
      const req: WithdrawRequest = { amount, gateway, account_info: accountInfo }
      const initial = await withdrawMutation.mutateAsync(req)
      const withdrawalId = initial.withdrawal_id

      // Poll for completion
      pollRef.current = setInterval(async () => {
        try {
          const status = await fetchWithdrawalStatus(withdrawalId)
          if (status.status !== 'pending') {
            stopPolling()
            const success = status.status === 'completed'
            setWithdrawResult({ success, autoRefund: !success })
            setWithdrawStep('result')
            // Refresh wallet data
            queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance })
            queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
          }
        } catch {
          stopPolling()
          setWithdrawResult({ success: false, autoRefund: true })
          setWithdrawStep('result')
        }
      }, 2000)
    } catch {
      setWithdrawResult({ success: false, autoRefund: false })
      setWithdrawStep('result')
    }
  }

  const stats = [
    { label: t('balance'), value: wallet?.balance ?? 0, icon: Wallet, color: 'text-primary-600' },
    { label: t('pendingBalance'), value: wallet?.pending_balance ?? 0, icon: Clock, color: 'text-warning-600' },
    { label: t('totalEarned'), value: wallet?.total_earned ?? 0, icon: TrendingUp, color: 'text-success-600' },
    { label: t('totalWithdrawn'), value: wallet?.total_withdrawn ?? 0, icon: TrendingDown, color: 'text-danger-600' },
  ]

  const getTxIcon = (type: string) => {
    if (type === 'withdrawn' || type === 'deducted') return ArrowDownRight
    return ArrowUpRight
  }
  const getTxColor = (type: string) => {
    if (type === 'withdrawn' || type === 'deducted') return 'text-danger-600'
    if (type === 'pending') return 'text-warning-600'
    return 'text-success-600'
  }
  const getTxSign = (type: string) => {
    if (type === 'withdrawn' || type === 'deducted') return '-'
    return '+'
  }

  const isFormValid = () => {
    const amount = Number(withdrawAmount)
    if (isNaN(amount) || amount < MIN_WITHDRAWAL_AMOUNT) return false
    if (amount > (wallet?.balance ?? 0)) return false
    if (gateway === 'qpay') return Boolean(bankName && accountNumber)
    return Boolean(phoneNumber)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
        <Button onClick={openModal} disabled={!wallet || wallet.balance < MIN_WITHDRAWAL_AMOUNT}>
          {t('withdraw')}
        </Button>
      </div>

      {/* Stat cards */}
      {walletLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={cn('h-4 w-4', stat.color)} />
                    <span className="text-xs text-text-muted">{stat.label}</span>
                  </div>
                  <p className={cn('text-lg font-bold', stat.color)}>
                    {formatCurrency(stat.value)}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Recent transactions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">{t('transactions')}</h2>
            <button
              onClick={() => navigate(ROUTES.WALLET_HISTORY)}
              className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
            >
              {tc('seeAll')}
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentTxns.length === 0 ? (
            <EmptyState title={t('noTransactions')} className="py-8" />
          ) : (
            <div className="space-y-3">
              {recentTxns.map((tx) => {
                const Icon = getTxIcon(tx.type)
                const color = getTxColor(tx.type)
                const sign = getTxSign(tx.type)
                return (
                  <div key={tx.id} className="flex items-center gap-3">
                    <div className={cn('flex h-8 w-8 items-center justify-center rounded-full bg-gray-100', color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-text-primary truncate">{tx.note}</p>
                      <p className="text-xs text-text-muted">{formatRelativeTime(tx.created_at)}</p>
                    </div>
                    <span className={cn('text-sm font-semibold', color)}>
                      {sign}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal modal */}
      <Modal open={modalOpen} onOpenChange={(open) => { if (!open) stopPolling(); setModalOpen(open) }}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>{t('withdrawTitle')}</ModalTitle>
            {withdrawStep === 'form' && (
              <ModalDescription>
                {t('withdrawMin', { amount: formatCurrency(MIN_WITHDRAWAL_AMOUNT) })}
              </ModalDescription>
            )}
          </ModalHeader>

          {withdrawStep === 'form' && (
            <div className="space-y-4">
              {/* Gateway selection */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t('withdrawGateway')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['qpay', 'bonum'] as const).map((gw) => (
                    <button
                      key={gw}
                      type="button"
                      onClick={() => setGateway(gw)}
                      className={cn(
                        'rounded-lg border-2 py-3 text-sm font-semibold transition-colors',
                        gateway === gw
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-border text-text-secondary hover:bg-surface-secondary',
                      )}
                    >
                      {gw === 'qpay' ? 'QPay' : 'Bonum'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 flex-wrap">
                {QUICK_WITHDRAWAL_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant={Number(withdrawAmount) === amt ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWithdrawAmount(String(amt))}
                  >
                    {formatCurrency(amt)}
                  </Button>
                ))}
                <Button
                  variant={Number(withdrawAmount) === (wallet?.balance ?? 0) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setWithdrawAmount(String(wallet?.balance ?? 0))}
                >
                  {t('withdrawAll')}
                </Button>
              </div>

              <Input
                label={t('withdrawAmount')}
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0"
              />

              {/* QPay: bank + account */}
              {gateway === 'qpay' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      {t('withdrawBank')}
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <option value="">Select bank...</option>
                      <option value="khan_bank">Khan Bank (Хаан банк)</option>
                      <option value="golomt">Golomt Bank (Голомт банк)</option>
                      <option value="tdb">TDB Bank</option>
                      <option value="xac">XacBank (Хас банк)</option>
                      <option value="state_bank">State Bank (Улсын банк)</option>
                      <option value="bogd_bank">Bogd Bank (Богд банк)</option>
                    </select>
                  </div>
                  <Input
                    label={t('withdrawAccount')}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="1234567890"
                  />
                </>
              )}

              {/* Bonum: phone */}
              {gateway === 'bonum' && (
                <Input
                  label={t('withdrawPhone')}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+976 9900 0000"
                />
              )}

              <ModalFooter>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  {tc('cancel')}
                </Button>
                <Button onClick={handleWithdraw} disabled={!isFormValid()}>
                  {tc('confirm')}
                </Button>
              </ModalFooter>
            </div>
          )}

          {withdrawStep === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Spinner className="h-10 w-10" />
              <p className="text-sm text-text-secondary">{t('withdrawProcessing')}</p>
            </div>
          )}

          {withdrawStep === 'result' && withdrawResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 gap-3">
                <div
                  className={cn(
                    'flex h-16 w-16 items-center justify-center rounded-full',
                    withdrawResult.success ? 'bg-success-50' : 'bg-danger-50',
                  )}
                >
                  {withdrawResult.success ? (
                    <CheckCircle className="h-8 w-8 text-success-600" />
                  ) : (
                    <XCircle className="h-8 w-8 text-danger-600" />
                  )}
                </div>
                <p className={cn('text-lg font-semibold', withdrawResult.success ? 'text-success-600' : 'text-danger-600')}>
                  {withdrawResult.success ? t('withdrawSuccess') : t('withdrawFailed')}
                </p>
                {withdrawResult.success && (
                  <p className="text-2xl font-bold text-text-primary">
                    {formatCurrency(Number(withdrawAmount))}
                  </p>
                )}
                {!withdrawResult.success && withdrawResult.autoRefund && (
                  <p className="text-sm text-text-secondary text-center px-4">
                    {t('withdrawAutoRefund')}
                  </p>
                )}
              </div>
              <ModalFooter>
                <Button className="w-full" onClick={() => { stopPolling(); setModalOpen(false) }}>
                  {tc('close')}
                </Button>
              </ModalFooter>
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
