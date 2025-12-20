'use client'

import { usePathname } from "next/navigation"
import BottomNavigation from "./BottomNavigation"
import HeaderApp from "./HeaderApp"
import AuthWrapper from "@/components/auth/AuthWrapper"

interface AppLayoutProps {
    children: React.ReactNode
}

const AppLayout = ({ children }: AppLayoutProps) => {
    const pathname = usePathname()
    const isAdminPage = pathname?.includes('/admin')

    if (isAdminPage) {
        return <>{children}</>
    }

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