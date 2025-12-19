'use client'

import { useEffect, useState } from 'react'
import { usePainainaApi } from '@/services/api-client'
import { adminService, type OverviewStats, type SystemHealth } from '@/services/admin.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Users,
    Map,
    MessageSquare,
    Image,
    TrendingUp,
    Activity,
    AlertCircle,
    CheckCircle2,
    XCircle
} from 'lucide-react'

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    loading
}: {
    title: string
    value: number | string
    subtitle?: string
    icon: React.ElementType
    trend?: { value: number; label: string }
    loading?: boolean
}) {
    if (loading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-32" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                )}
                {trend && (
                    <div className="flex items-center mt-2">
                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                        <span className="text-xs text-green-500">+{trend.value}</span>
                        <span className="text-xs text-gray-400 ml-1">{trend.label}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function HealthIndicator({ status }: { status: 'healthy' | 'degraded' | 'down' }) {
    const config = {
        healthy: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' },
        degraded: { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-100' },
        down: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' }
    }
    const { icon: Icon, color, bg } = config[status]

    return (
        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${bg}`}>
            <Icon className={`h-3 w-3 ${color}`} />
            <span className={`text-xs font-medium capitalize ${color}`}>{status}</span>
        </div>
    )
}

export default function AdminDashboard() {
    usePainainaApi() // Initialize API with auth

    const [stats, setStats] = useState<OverviewStats | null>(null)
    const [health, setHealth] = useState<SystemHealth | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)
                const [statsData, healthData] = await Promise.all([
                    adminService.getOverviewStats(),
                    adminService.getSystemHealth()
                ])
                setStats(statsData)
                setHealth(healthData)
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Overview of your application</p>
            </div>

            {/* System Health */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        System Health
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Database:</span>
                            {loading ? (
                                <Skeleton className="h-6 w-20" />
                            ) : (
                                <HealthIndicator status={health?.database || 'down'} />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Redis:</span>
                            {loading ? (
                                <Skeleton className="h-6 w-20" />
                            ) : (
                                <HealthIndicator status={health?.redis || 'down'} />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Storage:</span>
                            {loading ? (
                                <Skeleton className="h-6 w-20" />
                            ) : (
                                <HealthIndicator status={health?.storage || 'down'} />
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">API:</span>
                            {loading ? (
                                <Skeleton className="h-6 w-20" />
                            ) : (
                                <HealthIndicator status={health?.apiStatus || 'down'} />
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* User Stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Users</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers || 0}
                        icon={Users}
                        loading={loading}
                    />
                    <StatCard
                        title="Active Users"
                        value={stats?.activeUsers || 0}
                        subtitle="Last 30 days"
                        icon={Users}
                        loading={loading}
                    />
                    <StatCard
                        title="New This Month"
                        value={stats?.newUsersThisMonth || 0}
                        icon={TrendingUp}
                        loading={loading}
                    />
                    <StatCard
                        title="Banned Users"
                        value={stats?.bannedUsers || 0}
                        icon={AlertCircle}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Trip Stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Trips & Guides</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Trips"
                        value={stats?.totalTrips || 0}
                        icon={Map}
                        loading={loading}
                    />
                    <StatCard
                        title="Public Trips"
                        value={stats?.publicTrips || 0}
                        icon={Map}
                        loading={loading}
                    />
                    <StatCard
                        title="Private Trips"
                        value={stats?.privateTrips || 0}
                        icon={Map}
                        loading={loading}
                    />
                    <StatCard
                        title="Created This Month"
                        value={stats?.tripsCreatedThisMonth || 0}
                        icon={TrendingUp}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Content Stats */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Comments"
                        value={stats?.totalComments || 0}
                        icon={MessageSquare}
                        loading={loading}
                    />
                    <StatCard
                        title="Total Photos"
                        value={stats?.totalPhotos || 0}
                        icon={Image}
                        loading={loading}
                    />
                </div>
            </div>
        </div>
    )
}
