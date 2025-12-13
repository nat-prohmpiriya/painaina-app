import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services'
import type { User, UpdateUserRequest } from '@/interfaces'

// ============================================
// Query Keys
// ============================================
export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (limit: number) => [...userKeys.lists(), limit] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

// ============================================
// Query Hooks
// ============================================

/**
 * Fetch current authenticated user
 */
export const useCurrentUser = (enabled: boolean = true) => {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => userService.getMe(),
    enabled,
  })
}

/**
 * Fetch user by ID
 */
export const useUser = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => userService.getUser(userId),
    enabled: enabled && !!userId,
  })
}

/**
 * Fetch list of users
 */
export const useUsers = (limit: number = 10) => {
  return useQuery({
    queryKey: userKeys.list(limit),
    queryFn: () => userService.listUsers(limit),
  })
}

// ============================================
// Mutation Hooks
// ============================================

/**
 * Update current user profile
 */
export const useUpdateCurrentUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateUserRequest) => userService.updateMe(data),
    onSuccess: () => {
      // Invalidate current user query
      queryClient.invalidateQueries({ queryKey: userKeys.me() })
    },
  })
}

/**
 * Update user by ID (admin)
 */
export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserRequest }) =>
      userService.updateUser(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

/**
 * Delete current user account
 */
export const useDeleteCurrentUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => userService.deleteMe(),
    onSuccess: () => {
      // Clear all user-related queries
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}

/**
 * Delete user by ID (admin)
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => userService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all })
    },
  })
}
