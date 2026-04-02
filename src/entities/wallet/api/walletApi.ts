import { apiClient } from '@/shared/api'
import type { WalletSummary, Transaction, WithdrawRequest, WithdrawResult } from '../model/wallet.types'

export async function fetchWallet(): Promise<WalletSummary> {
  const { data } = await apiClient.get('/respondent/wallet')
  return data as WalletSummary
}

export async function fetchTransactions(params: {
  cursor?: string
  limit?: number
  type?: string
}): Promise<{ items: Transaction[]; cursor?: string; has_next: boolean }> {
  const { data, meta } = await apiClient.get('/respondent/wallet/transactions', { params })
  return {
    items: data as Transaction[],
    cursor: meta?.cursor ?? undefined,
    has_next: meta?.has_next ?? false,
  }
}

export async function requestWithdrawal(req: WithdrawRequest): Promise<WithdrawResult> {
  const { data } = await apiClient.post('/respondent/wallet/withdraw', req)
  return data as WithdrawResult
}

export async function fetchWithdrawalStatus(withdrawalId: string): Promise<WithdrawResult> {
  const { data } = await apiClient.get(`/respondent/wallet/withdraw/${withdrawalId}`)
  return data as WithdrawResult
}
