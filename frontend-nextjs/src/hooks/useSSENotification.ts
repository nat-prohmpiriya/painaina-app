'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

interface SSEEvent {
  type: string
  timestamp: number
}

interface UseSSENotificationResult {
  timestamp: number | null
  isConnected: boolean
  error: Error | null
}

export function useSSENotification(): UseSSENotificationResult {
  const { getToken, isSignedIn } = useAuth()
  const [timestamp, setTimestamp] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const baseReconnectDelay = 1000

  const connect = useCallback(async () => {
    if (!isSignedIn) {
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
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
      const sseUrl = `${baseUrl}/sse/notifications?token=${encodeURIComponent(token)}`

      // Create EventSource connection
      const eventSource = new EventSource(sseUrl)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        setIsConnected(true)
        setError(null)
        reconnectAttempts.current = 0
      }

      eventSource.addEventListener('connection', (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data)
          console.log('SSE connected:', data)
        } catch (e) {
          console.error('Failed to parse connection event:', e)
        }
      })

      eventSource.addEventListener('notification', (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data)
          setTimestamp(data.timestamp)
        } catch (e) {
          console.error('Failed to parse notification event:', e)
        }
      })

      eventSource.addEventListener('heartbeat', (event) => {
        // Heartbeat received, connection is alive
        try {
          const data: SSEEvent = JSON.parse(event.data)
          console.debug('SSE heartbeat:', data.timestamp)
        } catch (e) {
          // Ignore heartbeat parse errors
        }
      })

      eventSource.onerror = () => {
        setIsConnected(false)
        eventSource.close()
        eventSourceRef.current = null

        // Attempt reconnection with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts.current)
          reconnectAttempts.current++

          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, delay)
        } else {
          setError(new Error('Max reconnection attempts reached'))
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect'))
      setIsConnected(false)
    }
  }, [getToken, isSignedIn])

  useEffect(() => {
    if (isSignedIn) {
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
  }, [isSignedIn, connect])

  // Reconnect when window becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && isSignedIn) {
        reconnectAttempts.current = 0
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isConnected, isSignedIn, connect])

  return { timestamp, isConnected, error }
}
