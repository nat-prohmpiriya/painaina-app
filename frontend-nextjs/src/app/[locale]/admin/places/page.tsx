'use client'

import { useEffect, useState } from 'react'
import { usePainainaApi } from '@/services/api-client'
import { adminService, type Place, type PlaceCacheListResponse, type PlaceCacheStats } from '@/services/admin.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Search,
    Trash2,
    RefreshCw,
    Database,
    Clock,
    HardDrive,
    ChevronLeft,
    ChevronRight,
    AlertCircle
} from 'lucide-react'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { formatDistanceToNow } from 'date-fns'

export default function AdminPlacesPage() {
    usePainainaApi()
    const { showSuccess, showError } = useToastMessage()

    const [data, setData] = useState<PlaceCacheListResponse | null>(null)
    const [stats, setStats] = useState<PlaceCacheStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [statsLoading, setStatsLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const limit = 20

    // Action states
    const [clearing, setClearing] = useState(false)
    const [refreshing, setRefreshing] = useState<string | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchPlaces = async () => {
        try {
            setLoading(true)
            const result = await adminService.getCachedPlaces({
                search: search || undefined,
                page,
                limit
            })
            setData(result)
        } catch (err: any) {
            showError('Failed to load cached places', err.message)
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            setStatsLoading(true)
            const result = await adminService.getCacheStats()
            setStats(result)
        } catch (err: any) {
            console.error('Failed to load cache stats', err)
        } finally {
            setStatsLoading(false)
        }
    }

    useEffect(() => {
        fetchPlaces()
        fetchStats()
    }, [page])

    const handleSearch = () => {
        setPage(1)
        fetchPlaces()
    }

    const handleClearExpired = async () => {
        try {
            setClearing(true)
            const result = await adminService.clearExpiredCache()
            showSuccess(`Cleared ${result.deletedCount} expired cache entries`)
            fetchPlaces()
            fetchStats()
        } catch (err: any) {
            showError('Failed to clear expired cache', err.message)
        } finally {
            setClearing(false)
        }
    }

    const handleRefresh = async (googlePlaceId: string) => {
        try {
            setRefreshing(googlePlaceId)
            await adminService.refreshPlaceCache(googlePlaceId)
            showSuccess('Place cache refreshed successfully')
            fetchPlaces()
        } catch (err: any) {
            showError('Failed to refresh place cache', err.message)
        } finally {
            setRefreshing(null)
        }
    }

    const handleDelete = async () => {
        if (!selectedPlace) return

        try {
            setDeleting(true)
            await adminService.deleteCachedPlace(selectedPlace.id)
            showSuccess('Place cache deleted successfully')
            setDeleteDialogOpen(false)
            setSelectedPlace(null)
            fetchPlaces()
            fetchStats()
        } catch (err: any) {
            showError('Failed to delete place cache', err.message)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Places Cache</h1>
                    <p className="text-gray-500 mt-1">Manage Google Places API cache</p>
                </div>
                <Button
                    onClick={handleClearExpired}
                    disabled={clearing}
                    variant="outline"
                >
                    {clearing ? (
                        <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Clearing...
                        </>
                    ) : (
                        <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear Expired
                        </>
                    )}
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Cached</CardTitle>
                        <Database className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.totalCached || 0}</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Valid</CardTitle>
                        <Database className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold text-green-600">{stats?.validCount || 0}</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Expired</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold text-yellow-600">{stats?.expiredCount || 0}</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Est. Size</CardTitle>
                        <HardDrive className="h-4 w-4 text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold">{stats?.cacheSizeMB?.toFixed(2) || 0} MB</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by name, address, or Google Place ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="flex-1"
                        />
                        <Button onClick={handleSearch}>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Places Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Place</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4">
                                                <Skeleton className="h-4 w-48 mb-1" />
                                                <Skeleton className="h-3 w-64" />
                                            </td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : data?.places.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No cached places found
                                        </td>
                                    </tr>
                                ) : (
                                    data?.places.map((place) => (
                                        <tr key={place.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{place.name}</div>
                                                <div className="text-sm text-gray-500 truncate max-w-md">{place.address}</div>
                                                <div className="text-xs text-gray-400 mt-1 font-mono">{place.googlePlaceId}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {place.categories?.slice(0, 3).map((cat) => (
                                                        <Badge key={cat} variant="secondary" className="text-xs">
                                                            {cat}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {place.rating ? (
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-yellow-500">★</span>
                                                        <span className="text-sm">{place.rating}</span>
                                                        <span className="text-xs text-gray-400">
                                                            ({place.userRatingsTotal || 0})
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDistanceToNow(new Date(place.updatedAt), { addSuffix: true })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRefresh(place.googlePlaceId)}
                                                        disabled={refreshing === place.googlePlaceId}
                                                    >
                                                        <RefreshCw className={`h-4 w-4 ${refreshing === place.googlePlaceId ? 'animate-spin' : ''}`} />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            setSelectedPlace(place)
                                                            setDeleteDialogOpen(true)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {data && data.totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t">
                            <div className="text-sm text-gray-500">
                                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.total)} of {data.total} places
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                                    disabled={page === data.totalPages}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Cached Place</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the cache for "{selectedPlace?.name}"?
                            The data will be fetched again from Google Places API when needed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={deleting}
                        >
                            {deleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
