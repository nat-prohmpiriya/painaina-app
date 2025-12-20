'use client'

import { useEffect, useState } from 'react'
import { usePainainaApi } from '@/services/api-client'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { adminService, type Comment, type CommentListResponse } from '@/services/admin.service'
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
    Heart,
    MessageSquare,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { formatDistanceToNow } from 'date-fns'

export default function AdminCommentsPage() {
    usePainainaApi()
    useDocumentTitle('Comments')
    const { showSuccess, showError } = useToastMessage()

    const [data, setData] = useState<CommentListResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [targetTypeFilter, setTargetTypeFilter] = useState('all')
    const [page, setPage] = useState(1)
    const limit = 20

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null)
    const [deleting, setDeleting] = useState(false)

    const fetchComments = async () => {
        try {
            setLoading(true)
            const result = await adminService.getComments({
                search: search || undefined,
                targetType: targetTypeFilter === 'all' ? undefined : targetTypeFilter,
                page,
                limit
            })
            setData(result)
        } catch (err: any) {
            showError('Failed to load comments', err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchComments()
    }, [page, targetTypeFilter])

    const handleSearch = () => {
        setPage(1)
        fetchComments()
    }

    const handleDelete = async () => {
        if (!selectedComment) return

        try {
            setDeleting(true)
            await adminService.deleteComment(selectedComment.id)
            showSuccess('Comment deleted successfully')
            setDeleteDialogOpen(false)
            setSelectedComment(null)
            fetchComments()
        } catch (err: any) {
            showError('Failed to delete comment', err.message)
        } finally {
            setDeleting(false)
        }
    }

    const getTargetTypeBadge = (type: string) => {
        switch (type) {
            case 'trip':
                return <Badge>Trip</Badge>
            case 'place':
                return <Badge variant="secondary">Place</Badge>
            case 'comment':
                return <Badge variant="outline">Reply</Badge>
            default:
                return <Badge variant="outline">{type}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Comments</h1>
                <p className="text-gray-500 mt-1">Moderate user comments</p>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 flex gap-2">
                            <Input
                                placeholder="Search by content..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button onClick={handleSearch}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                        <Select value={targetTypeFilter} onValueChange={setTargetTypeFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="trip">Trip</SelectItem>
                                <SelectItem value="place">Place</SelectItem>
                                <SelectItem value="comment">Reply</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Comments Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
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
                                                <Skeleton className="h-4 w-64" />
                                            </td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-6 w-16" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                            <td className="px-6 py-4"><Skeleton className="h-8 w-10 ml-auto" /></td>
                                        </tr>
                                    ))
                                ) : data?.comments.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No comments found
                                        </td>
                                    </tr>
                                ) : (
                                    data?.comments.map((comment) => (
                                        <tr key={comment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="max-w-md">
                                                    <p className="text-sm text-gray-900 line-clamp-2">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {comment.user?.photoUrl && (
                                                        <img
                                                            src={comment.user.photoUrl}
                                                            alt={comment.user.name}
                                                            className="h-6 w-6 rounded-full"
                                                        />
                                                    )}
                                                    <div>
                                                        <div className="text-sm text-gray-900">{comment.user?.name || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-500">{comment.user?.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getTargetTypeBadge(comment.targetType)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="h-4 w-4" />
                                                        {comment.reactionsCount || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="h-4 w-4" />
                                                        {comment.repliesCount || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => {
                                                        setSelectedComment(comment)
                                                        setDeleteDialogOpen(true)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
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
                                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.total)} of {data.total} comments
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
                        <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this comment? This action cannot be undone.
                            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-700">
                                "{selectedComment?.content?.slice(0, 100)}..."
                            </div>
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
