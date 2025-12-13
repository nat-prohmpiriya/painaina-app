import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tripService } from '@/services'
import type {
  Trip,
  CreateTripRequest,
  UpdateTripRequest,
  ListTripsQuery,
  TripMember,
  InviteMemberRequest,
  SetBudgetRequest,
} from '@/interfaces'

// ============================================
// Query Keys
// ============================================
export const tripKeys = {
  all: ['trips'] as const,
  lists: () => [...tripKeys.all, 'list'] as const,
  list: (filters: ListTripsQuery) => [...tripKeys.lists(), filters] as const,
  details: () => [...tripKeys.all, 'detail'] as const,
  detail: (id: string) => [...tripKeys.details(), id] as const,
  members: (id: string) => [...tripKeys.all, id, 'members'] as const,
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch list of trips with optional filters
 */
export const useTrips = (query: ListTripsQuery = {}) => {
  return useQuery({
    queryKey: tripKeys.list(query),
    queryFn: () => tripService.listTrips(query),
  })
}

/**
 * Fetch single trip by ID with all aggregated data (itineraries, entries, expenses, users)
 */
export const useTrip = (tripId: string) => {
  return useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripService.getTrip(tripId),
    enabled: !!tripId,
  })
}

/**
 * Fetch trip members
 */
export const useTripMembers = (tripId: string) => {
  return useQuery({
    queryKey: tripKeys.members(tripId),
    queryFn: () => tripService.getMembers(tripId),
    enabled: !!tripId,
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Create new trip
 */
export const useCreateTrip = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTripRequest) => tripService.createTrip(data),
    onSuccess: () => {
      // Invalidate all trip lists
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
    },
  })
}

/**
 * Update existing trip
 */
export const useUpdateTrip = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, data }: { tripId: string; data: UpdateTripRequest }) =>
      tripService.updateTrip(tripId, data),

    onMutate: async ({ tripId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: tripKeys.detail(tripId) })

      // Snapshot previous data
      const previousData = queryClient.getQueryData(tripKeys.detail(tripId))

      // Optimistically update cache
      queryClient.setQueryData(tripKeys.detail(tripId), (old: any) => {
        if (!old) return old

        return {
          ...old,
          ...data,
        }
      })

      return { previousData }
    },

    onError: (err, { tripId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(tripKeys.detail(tripId), context.previousData)
      }
    },

    onSettled: (_, __, variables) => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(variables.tripId) })
      // Also invalidate lists in case trip metadata changed
      queryClient.invalidateQueries({ queryKey: tripKeys.lists() })
    },
  })
}

/**
 * Delete trip
 */
export const useDeleteTrip = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (tripId: string) => tripService.deleteTrip(tripId),
    onSuccess: () => {
      // Invalidate all trip-related queries
      queryClient.invalidateQueries({ queryKey: tripKeys.all })
    },
  })
}

/**
 * Set trip budget
 */
export const useSetTripBudget = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, data }: { tripId: string; data: SetBudgetRequest }) =>
      tripService.setBudget(tripId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.detail(variables.tripId) })
    },
  })
}

/**
 * Invite member to trip
 */
export const useInviteTripMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, data }: { tripId: string; data: InviteMemberRequest }) =>
      tripService.inviteMember(tripId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.members(variables.tripId) })
    },
  })
}

/**
 * Remove member from trip
 */
export const useRemoveTripMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ tripId, userId }: { tripId: string; userId: string }) =>
      tripService.removeMember(tripId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.members(variables.tripId) })
    },
  })
}

/**
 * Update member role
 */
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      tripId,
      userId,
      role,
    }: {
      tripId: string
      userId: string
      role: 'owner' | 'admin' | 'editor' | 'viewer'
    }) => tripService.updateMemberRole(tripId, userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tripKeys.members(variables.tripId) })
    },
  })
}
