'use client'

import React, { createContext, useContext } from 'react'
import { App } from 'antd'

interface ToastMessageContextType {
  showSuccess: (message: string, description?: string) => void
  showError: (message: string, description?: string) => void
  showWarning: (message: string, description?: string) => void
  showInfo: (message: string, description?: string) => void
}

const ToastMessageContext = createContext<ToastMessageContextType | undefined>(undefined)

export const ToastMessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <App>
      <ToastMessageContent>{children}</ToastMessageContent>
    </App>
  )
}

const ToastMessageContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { notification } = App.useApp()

  const contextValue: ToastMessageContextType = {
    showSuccess: (message: string, description?: string) => {
      notification.success({
        message,
        description,
        placement: 'topRight',
        duration: 4.5,
      })
    },
    showError: (message: string, description?: string) => {
      notification.error({
        message,
        description,
        placement: 'topRight',
        duration: 6,
      })
    },
    showWarning: (message: string, description?: string) => {
      notification.warning({
        message,
        description,
        placement: 'topRight',
        duration: 5,
      })
    },
    showInfo: (message: string, description?: string) => {
      notification.info({
        message,
        description,
        placement: 'topRight',
        duration: 4.5,
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