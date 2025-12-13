'use client'

import { AntdRegistry } from '@ant-design/nextjs-registry';
import '@ant-design/v5-patch-for-react-19';
import { ConfigProvider } from 'antd';
import { appTheme } from '@/themes/appTheme';
import AppLayout from '@/components/layout/AppLayout';
import { ClerkProvider } from '@clerk/nextjs';
import { ToastMessageProvider } from '@/contexts/ToastMessageContext';
import { QueryProvider } from './QueryProvider';
import { AuthTokenInitializer } from '@/components/auth/AuthTokenInitializer';

interface AppProviderProps {
    children: React.ReactNode
}

const AppProvider = ({ children }: AppProviderProps) => {
    return (
        <ClerkProvider>
            <AuthTokenInitializer />
            <QueryProvider>
                <AntdRegistry>
                    <ConfigProvider theme={appTheme}>
                        <ToastMessageProvider>
                            <AppLayout>
                                {children}
                            </AppLayout>
                        </ToastMessageProvider>
                    </ConfigProvider>
                </AntdRegistry>
            </QueryProvider>
        </ClerkProvider>
    )
}

export default AppProvider
