import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/config/queryKeys'
import { fetchWallet, fetchTransactions, requestWithdrawal } from '../api/walletApi'
import type { WithdrawRequest } from '../model/wallet.types'

export function useWallet() {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: fetchWallet,
    staleTime: 30 * 1000,
  })
}

export function useTransactions(typeFilter?: string) {
  return useInfiniteQuery({
    queryKey: ['wallet', 'transactions', typeFilter],
    queryFn: ({ pageParam }) =>
      fetchTransactions({ cursor: pageParam as string | undefined, limit: 20, type: typeFilter }),
    getNextPageParam: (lastPage) => (lastPage.has_next ? lastPage.cursor : undefined),
    initialPageParam: undefined as string | undefined,
    staleTime: 60 * 1000,
  })
}

export function useWithdraw() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (req: WithdrawRequest) => requestWithdrawal(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.balance })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] })
    },
  })
}
