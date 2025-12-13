import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { expenseService } from '@/services/expense.service'
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest
} from '@/interfaces/expense.interface'
import { tripKeys } from './useTripQueries'

// Query Keys
export const expenseKeys = {
  all: ['expenses'] as const,
  byTrip: (tripId: string) => [...expenseKeys.all, 'trip', tripId] as const,
  byEntry: (entryId: string) => [...expenseKeys.all, 'entry', entryId] as const,
  detail: (expenseId: string) => [...expenseKeys.all, 'detail', expenseId] as const,
}

// Queries
export const useExpensesByTrip = (tripId: string) => {
  return useQuery({
    queryKey: expenseKeys.byTrip(tripId),
    queryFn: () => expenseService.getExpensesByTrip(tripId),
    enabled: !!tripId,
  })
}

export const useExpensesByEntry = (tripId: string, entryId: string) => {
  // Backend doesn't have getExpensesByEntry endpoint
  // Fetch all trip expenses and filter by entryId client-side
  return useQuery({
    queryKey: expenseKeys.byEntry(entryId),
    queryFn: async () => {
      const allExpenses = await expenseService.getExpensesByTrip(tripId)
      return allExpenses.filter(expense => expense.entryId === entryId)
    },
    enabled: !!tripId && !!entryId,
  })
}

export const useExpenseDetail = (tripId: string, expenseId: string) => {
  return useQuery({
    queryKey: expenseKeys.detail(expenseId),
    queryFn: () => expenseService.getExpense(tripId, expenseId),
    enabled: !!tripId && !!expenseId,
  })
}

// Mutations
export const useCreateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateExpenseRequest) => expenseService.createExpense(data.tripId, data),
    onSuccess: (_, variables) => {
      queryClient.refetchQueries({ queryKey: expenseKeys.byTrip(variables.tripId) })
      queryClient.refetchQueries({ queryKey: tripKeys.detail(variables.tripId) })
      if (variables.entryId) {
        queryClient.refetchQueries({ queryKey: expenseKeys.byEntry(variables.entryId) })
      }
    },
  })
}

export const useUpdateExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, expenseId, data }: { tripId: string; expenseId: string; data: UpdateExpenseRequest }) =>
      expenseService.updateExpense(tripId, expenseId, data),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(expense.id) })
      queryClient.invalidateQueries({ queryKey: expenseKeys.byTrip(expense.tripId) })
      if (expense.entryId) {
        queryClient.invalidateQueries({ queryKey: expenseKeys.byEntry(expense.entryId) })
      }
    },
  })
}

export const useDeleteExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, expenseId }: { tripId: string; expenseId: string }) =>
      expenseService.deleteExpense(tripId, expenseId),
    onSuccess: (_, variables) => {
      queryClient.refetchQueries({ queryKey: expenseKeys.byTrip(variables.tripId) })
      queryClient.refetchQueries({ queryKey: tripKeys.detail(variables.tripId) })
    },
  })
}

export const useSettleExpense = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, expenseId }: { tripId: string; expenseId: string }) =>
      expenseService.settleExpense(tripId, expenseId),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.detail(expense.id) })
      queryClient.invalidateQueries({ queryKey: expenseKeys.byTrip(expense.tripId) })
      if (expense.entryId) {
        queryClient.invalidateQueries({ queryKey: expenseKeys.byEntry(expense.entryId) })
      }
    },
  })
}
