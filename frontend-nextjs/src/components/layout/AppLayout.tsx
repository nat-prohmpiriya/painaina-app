'use client'

import BottomNavigation from "./BottomNavigation"
import HeaderApp from "./HeaderApp"
import AuthWrapper from "@/components/auth/AuthWrapper"

interface AppLayoutProps {
    children: React.ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
    return (
        // <AuthWrapper>
        <>
            <HeaderApp />
            <main className="pb-16 lg:pb-0">
                {children}
            </main>
            <BottomNavigation />
        </>
        // </AuthWrapper>

    )
}

export default AppLayout