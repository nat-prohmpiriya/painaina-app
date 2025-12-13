'use client'

import React, { createContext, useContext } from 'react'
import { toast } from 'sonner'

interface ToastMessageContextType {
  showSuccess: (message: string, description?: string) => void
  showError: (message: string, description?: string) => void
  showWarning: (message: string, description?: string) => void
  showInfo: (message: string, description?: string) => void
}

const ToastMessageContext = createContext<ToastMessageContextType | undefined>(undefined)

export const ToastMessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contextValue: ToastMessageContextType = {
    showSuccess: (message: string, description?: string) => {
      toast.success(message, {
        description,
        duration: 4500,
      })
    },
    showError: (message: string, description?: string) => {
      toast.error(message, {
        description,
        duration: 6000,
      })
    },
    showWarning: (message: string, description?: string) => {
      toast.warning(message, {
        description,
        duration: 5000,
      })
    },
    showInfo: (message: string, description?: string) => {
      toast.info(message, {
        description,
        duration: 4500,
      })
    },
  }

  return (
    <ToastMessageContext.Provider value={contextValue}>
      {children}
    </ToastMessageContext.Provider>
  )
}

export const useToastMessage = (): ToastMessageContextType => {
  const context = useContext(ToastMessageContext)
  if (!context) {
    throw new Error('useToastMessage must be used within ToastMessageProvider')
  }
  return context
}
