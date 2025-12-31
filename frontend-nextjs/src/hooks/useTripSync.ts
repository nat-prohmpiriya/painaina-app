'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useQueryClient } from '@tanstack/react-query'

interface TripSyncEvent {
  type: string
  tripId: string
  action: string
  resource: string
  data?: Record<string, unknown>
  userId: string
  timestamp: number
}

interface UseTripSyncOptions {
  tripId: string
  enabled?: boolean
  onUpdate?: (event: TripSyncEvent) => void
}

interface UseTripSyncResult {
  isConnected: boolean
  lastEvent: TripSyncEvent | null
  error: Error | null
  subscriberCount: number
}

export function useTripSync({
  tripId,
  enabled = true,
  onUpdate,
}: UseTripSyncOptions): UseTripSyncResult {
  const { getToken, isSignedIn } = useAuth()
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<TripSyncEvent | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [subscriberCount, setSubscriberCount] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  // Invalidate relevant queries based on the event
  const handleTripSyncEvent = useCallback(
    (event: TripSyncEvent) => {
      setLastEvent(event)

      // Call custom handler if provided
      if (onUpdate) {
        onUpdate(event)
      }

      // Invalidate React Query cache based on resource type
      switch (event.resource) {
        case 'trip':
          queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
          break
        case 'itinerary':
          queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
          queryClient.invalidateQueries({ queryKey: ['itineraries', tripId] })
          break
        case 'entry':
          queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
          queryClient.invalidateQueries({ queryKey: ['itineraries', tripId] })
          if (event.data?.itineraryId) {
            queryClient.invalidateQueries({
              queryKey: ['entries', event.data.itineraryId],
            })
          }
          break
        case 'expense':
          queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
          queryClient.invalidateQueries({ queryKey: ['expenses', tripId] })
          break
        case 'packing':
          queryClient.invalidateQueries({ queryKey: ['packingList', tripId] })
          break
        case 'member':
          queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
          queryClient.invalidateQueries({ queryKey: ['tripMembers', tripId] })
          break
        default:
          // Invalidate all trip-related queries
          queryClient.invalidateQueries({ queryKey: ['trip', tripId] })
      }
    },
    [tripId, queryClient, onUpdate]
  )

  const connect = useCallback(async () => {
    if (!isSignedIn || !tripId || !enabled) {
      return
    }

    try {
      // Get auth token
      const token = await getToken()
      if (!token) {
        setError(new Error('Failed to get auth token'))
        return
      }

      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      // Build SSE URL with token as query parameter
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
      const sseUrl = `${baseUrl}/trips/${tripId}/sync?token=${encodeURIComponent(token)}`

      // Create EventSource connection
      const eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
        console.log(`[TripSync] Connected to trip ${tripId}`)
      }

      // Listen for trip_sync events
      eventSource.addEventListener('trip_sync', (event) => {
        try {
          const data: TripSyncEvent = JSON.parse(event.data)

          // Skip heartbeat events
          if (data.type === 'heartbeat') {
            console.debug('[TripSync] Heartbeat received')
            return
          }

          // Skip connected event but update subscriber count if available
          if (data.type === 'connected') {
            console.log('[TripSync] Subscription confirmed')
            return
          }

          console.log('[TripSync] Received event:', data.type, data)
          handleTripSyncEvent(data)
        } catch (e) {
          console.error('[TripSync] Failed to parse event:', e)
        }
      })

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()
        eventSourceRef.current = null

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay =
            baseReconnectDelay * Math.pow(2, reconnectAttempts.current)
          reconnectAttempts.current++

          console.log(
            `[TripSync] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`
          )

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          setError(new Error('Max reconnection attempts reached'))
          console.error('[TripSync] Max reconnection attempts reached')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'))
      setIsConnected(false)
    }
  }, [getToken, isSignedIn, tripId, enabled, handleTripSyncEvent])

  useEffect(() => {
    if (isSignedIn && tripId && enabled) {
      connect()
    }

    return () => {
      // Cleanup on unmount
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }
  }, [isSignedIn, tripId, enabled, connect])

  // Reconnect when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        !isConnected &&
        isSignedIn &&
        tripId &&
        enabled
      ) {
        reconnectAttempts.current = 0
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isConnected, isSignedIn, tripId, enabled, connect])

  return { isConnected, lastEvent, error, subscriberCount }
}
