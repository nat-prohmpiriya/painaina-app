'use client'

import { useEffect, useState } from 'react'
import { usePainainaApi } from '@/services/api-client'
import { adminService, type Trip, type TripListResponse } from '@/services/admin.service'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
    Eye,
    Heart,
    ChevronLeft,
    ChevronRight,
    ExternalLink
} from 'lucide-react'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminTripsPage() {
    usePainainaApi()
    const { showSuccess, showError } = useToastMessage()
    const pathname = usePathname()
    const locale = pathname.split('/')[1] || 'en'

    const [data, setData] = useState<TripListResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const limit = 20

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchTrips = async () => {
        try {
            setLoading(true)
            const result = await adminService.getTrips({
                search: search || undefined,
                type: 'trip',
                status: statusFilter === 'all' ? undefined : statusFilter,
                page,
                limit
            })
            setData(result)
        } catch (err: any) {
            showError('Failed to load trips', err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTrips()
    }, [page, statusFilter])

    const handleSearch = () => {
        setPage(1)
        fetchTrips()
    }

    const handleDelete = async () => {
        if (!selectedTrip) return

        try {
            setDeleting(true)
            await adminService.deleteTrip(selectedTrip.id)
            showSuccess('Trip deleted successfully')
            setDeleteDialogOpen(false)
            setSelectedTrip(null)
            fetchTrips()
        } catch (err: any) {
            showError('Failed to delete trip', err.message)
        } finally {
            setDeleting(false)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published':
                return <Badge className="bg-green-100 text-green-800">Published</Badge>
            case 'draft':
                return <Badge variant="secondary">Draft</Badge>
            case 'archived':
                return <Badge variant="outline">Archived</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
                <p className="text-gray-500 mt-1">Manage user trips</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 flex gap-2">
                            <Input
                                placeholder="Search by title..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Trips Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            <td className="px-6 py-4">
                                                <Skeleton className="h-4 w-48 mb-1" />
                                                <Skeleton className="h-3 w-32" />
                                            </td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-8 w-20 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : data?.trips.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No trips found
                                        </td>
                                    </tr>
                                ) : (
                                    data?.trips.map((trip) => (
                                        <tr key={trip.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{trip.title}</div>
                                                <div className="text-sm text-gray-500">
                                                    {trip.destinations?.name}, {trip.destinations?.country}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {trip.owner?.photoUrl && (
                                                        <img
                                                            src={trip.owner.photoUrl}
                                                            alt={trip.owner.name}
                                                            className="h-6 w-6 rounded-full"
                                                        />
                                                    )}
                                                    <span className="text-sm text-gray-900">{trip.owner?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(trip.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-4 w-4" />
                                                        {trip.viewCount || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-4 w-4" />
                                                        {trip.reactionsCount || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDistanceToNow(new Date(trip.createdAt), { addSuffix: true })}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/${locale}/trips/${trip.id}`} target="_blank">
                                                        <Button size="sm" variant="ghost">
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            setSelectedTrip(trip)
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
                                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.total)} of {data.total} trips
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
                        <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedTrip?.title}"? This action cannot be undone.
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
