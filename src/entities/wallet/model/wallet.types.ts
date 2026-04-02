export interface WalletSummary {
  balance: number
  pending_balance: number
  total_earned: number
  total_withdrawn: number
}

export type TransactionType = 'earned' | 'pending' | 'released' | 'withdrawn' | 'refunded' | 'deducted'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  balance_after: number
  note: string
  created_at: string
}

export interface WithdrawRequest {
  amount: number
  gateway: 'qpay' | 'bonum'
  account_info: {
    bank?: string
    account_number?: string
    phone?: string
  }
}

export interface WithdrawResult {
  withdrawal_id: string
  status: 'pending' | 'completed' | 'failed'
  amount: number
}
