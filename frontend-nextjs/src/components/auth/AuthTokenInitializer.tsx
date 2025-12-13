'use client'

import { useEffect } from 'react'
import { usePainainaApi } from '@/services/api-client'

/**
 * Component to initialize auth token getter for API client
 * Must be rendered within ClerkProvider
 */
export function AuthTokenInitializer() {
  // This hook call sets up the token getter for all API requests
  usePainainaApi()

  return null // This component doesn't render anything
}
