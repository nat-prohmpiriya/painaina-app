'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationService, GetNotificationsResponse } from '@/services/notification.service'
import { useAuth } from '@clerk/nextjs'
import { useSSENotification } from './useSSENotification'
import { useEffect, useRef } from 'react'

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  list: (limit: number, offset: number) => [...NOTIFICATION_KEYS.all, 'list', limit, offset] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unreadCount'] as const,
}

export function useNotifications(limit = 20, offset = 0) {
  const { isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const { timestamp } = useSSENotification()
  const previousTimestamp = useRef<number | null>(null)

  // When SSE signal changes, refetch notifications
  useEffect(() => {
    if (timestamp && timestamp !== previousTimestamp.current) {
      previousTimestamp.current = timestamp
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    }
  }, [timestamp, queryClient])

  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(limit, offset),
    queryFn: () => notificationService.getNotifications(limit, offset),
    enabled: isSignedIn,
    refetchOnWindowFocus: true,
  })
}

export function useUnreadCount() {
  const { isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const { timestamp } = useSSENotification()
  const previousTimestamp = useRef<number | null>(null)

  // When SSE signal changes, refetch unread count
  useEffect(() => {
    if (timestamp && timestamp !== previousTimestamp.current) {
      previousTimestamp.current = timestamp
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount() })
    }
  }, [timestamp, queryClient])

  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isSignedIn,
    refetchOnWindowFocus: true,
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onMutate: async (notificationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all })

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<GetNotificationsResponse>(
        NOTIFICATION_KEYS.list(20, 0)
      )
      const previousCount = queryClient.getQueryData<number>(NOTIFICATION_KEYS.unreadCount())

      // Optimistically update notifications list
      queryClient.setQueryData<GetNotificationsResponse>(
        NOTIFICATION_KEYS.list(20, 0),
        (old) => {
          if (!old) return old
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          }
        }
      )

      // Optimistically update unread count
      queryClient.setQueryData<number>(NOTIFICATION_KEYS.unreadCount(), (old) => {
        if (old === undefined) return old
        return Math.max(0, old - 1)
      })

      return { previousNotifications, previousCount }
    },
    onError: (_error, _notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_KEYS.list(20, 0), context.previousNotifications)
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), context.previousCount)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_KEYS.all })

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<GetNotificationsResponse>(
        NOTIFICATION_KEYS.list(20, 0)
      )
      const previousCount = queryClient.getQueryData<number>(NOTIFICATION_KEYS.unreadCount())

      // Optimistically update notifications list
      queryClient.setQueryData<GetNotificationsResponse>(
        NOTIFICATION_KEYS.list(20, 0),
        (old) => {
          if (!old) return old
          return {
            ...old,
            notifications: old.notifications.map((n) => ({ ...n, isRead: true })),
          }
        }
      )

      // Optimistically update unread count to 0
      queryClient.setQueryData<number>(NOTIFICATION_KEYS.unreadCount(), 0)

      return { previousNotifications, previousCount }
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATION_KEYS.list(20, 0), context.previousNotifications)
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(NOTIFICATION_KEYS.unreadCount(), context.previousCount)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all })
    },
  })
}
