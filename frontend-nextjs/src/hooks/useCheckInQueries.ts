import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { checkInService } from '@/services/checkin.service'
import type {
  CheckIn,
  CreateCheckInRequest,
  UpdateCheckInRequest,
} from '@/interfaces/checkin'

// ============================================
// Query Keys
// ============================================
export const checkInKeys = {
  all: ['checkins'] as const,
  lists: () => [...checkInKeys.all, 'list'] as const,
  userList: (userId: string) => [...checkInKeys.lists(), userId] as const,
  details: () => [...checkInKeys.all, 'detail'] as const,
  detail: (id: string) => [...checkInKeys.details(), id] as const,
  stats: (userId: string) => [...checkInKeys.all, 'stats', userId] as const,
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch user's check-ins with stats
 */
export const useUserCheckIns = (userId: string | undefined) => {
  return useQuery({
    queryKey: checkInKeys.userList(userId || ''),
    queryFn: () => checkInService.getUserCheckIns(userId!),
    enabled: !!userId,
  })
}

/**
 * Fetch user's check-in stats only
 */
export const useUserCheckInStats = (userId: string | undefined) => {
  return useQuery({
    queryKey: checkInKeys.stats(userId || ''),
    queryFn: () => checkInService.getUserCheckInStats(userId!),
    enabled: !!userId,
  })
}

/**
 * Fetch single check-in by ID
 */
export const useCheckIn = (checkInId: string) => {
  return useQuery({
    queryKey: checkInKeys.detail(checkInId),
    queryFn: () => checkInService.getCheckIn(checkInId),
    enabled: !!checkInId,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create new check-in
 */
export const useCreateCheckIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCheckInRequest) => checkInService.createCheckIn(data),
    onSuccess: () => {
      // Invalidate all check-in queries
      queryClient.invalidateQueries({ queryKey: checkInKeys.all })
    },
  })
}

/**
 * Update existing check-in
 */
export const useUpdateCheckIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ checkInId, data }: { checkInId: string; data: UpdateCheckInRequest }) =>
      checkInService.updateCheckIn(checkInId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.all })
    },
  })
}

/**
 * Delete check-in
 */
export const useDeleteCheckIn = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (checkInId: string) => checkInService.deleteCheckIn(checkInId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkInKeys.all })
    },
  })
}
