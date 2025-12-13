'use client'

import AppLayout from '@/components/layout/AppLayout';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastMessageProvider } from '@/contexts/ToastMessageContext';
import { QueryProvider } from './QueryProvider';
import { AuthTokenInitializer } from '@/components/auth/AuthTokenInitializer';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

interface AppProviderProps {
    children: React.ReactNode
}

const AppProvider = ({ children }: AppProviderProps) => {
    return (
        <ClerkProvider>
            <AuthTokenInitializer />
            <QueryProvider>
                <TooltipProvider>
                    <ToastMessageProvider>
                        <AppLayout>
                            {children}
                        </AppLayout>
                        <Toaster position="top-right" />
                    </ToastMessageProvider>
                </TooltipProvider>
            </QueryProvider>
        </ClerkProvider>
    )
}

export default AppProvider
