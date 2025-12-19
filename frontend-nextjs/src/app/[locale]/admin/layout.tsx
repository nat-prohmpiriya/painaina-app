'use client'

import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Users,
    Map,
    BookOpen,
    MessageSquare,
    Database,
    Menu,
    X,
    LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const sidebarItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/trips', label: 'Trips', icon: Map },
    { href: '/admin/guides', label: 'Guides', icon: BookOpen },
    { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
    { href: '/admin/places', label: 'Places Cache', icon: Database },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn } = useAuth()
    const { user } = useUser()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Extract locale from pathname
    const locale = pathname.split('/')[1] || 'en'

    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push(`/${locale}/sign-in`)
        }
    }, [isLoaded, isSignedIn, router, locale])

    // Check if user is admin (you may need to adjust this based on your user metadata)
    const isAdmin = user?.publicMetadata?.role === 'admin' ||
                   user?.unsafeMetadata?.role === 'admin' ||
                   user?.primaryEmailAddress?.emailAddress?.includes('@painaina.com')

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
        )
    }

    if (!isSignedIn) {
        return null
    }

    // For development, allow access even without admin role
    // In production, uncomment the following:
    // if (!isAdmin) {
    //     return (
    //         <div className="flex items-center justify-center min-h-screen">
    //             <div className="text-center">
    //                 <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
    //                 <p className="mt-2 text-gray-600">You don't have permission to access the admin panel.</p>
    //             </div>
    //         </div>
    //     )
    // }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-white"
                >
                    {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
            </div>

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="flex items-center h-16 px-6 border-b border-gray-200">
                        <Link href={`/${locale}/admin`} className="flex items-center gap-2">
                            <span className="text-xl font-bold text-gray-900">Admin Panel</span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        {sidebarItems.map((item) => {
                            const isActive = pathname === `/${locale}${item.href}` ||
                                           (item.href !== '/admin' && pathname.startsWith(`/${locale}${item.href}`))
                            return (
                                <Link
                                    key={item.href}
                                    href={`/${locale}${item.href}`}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                        isActive
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-700 hover:bg-gray-100"
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User info */}
                    <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center gap-3">
                            <img
                                src={user?.imageUrl}
                                alt={user?.fullName || 'User'}
                                className="w-8 h-8 rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.fullName}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.primaryEmailAddress?.emailAddress}
                                </p>
                            </div>
                        </div>
                        <Link href={`/${locale}`}>
                            <Button variant="outline" size="sm" className="w-full mt-3">
                                <LogOut className="h-4 w-4 mr-2" />
                                Back to App
                            </Button>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <main className="lg:pl-64">
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
