'use client'

import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Heart, MessageSquare, MoreHorizontal, Pencil, Trash, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { commentService } from '@/services'
import CommentInput from './CommentInput'
import { CommentWithUser } from '@/interfaces/comment.interface'

interface CommentItemProps {
    comment: CommentWithUser;
    guideId?: string;
    onReplySubmitted?: () => void;
    isReply?: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({
    comment,
    guideId,
    onReplySubmitted,
    isReply = false
}) => {
    const [isReplying, setIsReplying] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)
    const [showAllReplies, setShowAllReplies] = useState(false)
    const [isLikeLoading, setIsLikeLoading] = useState(false)
    const [isUpdateLoading, setIsUpdateLoading] = useState(false)

    const { user, isSignedIn } = useUser()
    const { showSuccess, showError, showWarning } = useToastMessage()

    const isOwner = isSignedIn && user?.id === comment.userId

    const formatDate = (timestamp: number) => {
        console.log('Formatting date for timestamp:', timestamp)
        const date = new Date(timestamp)
        const now = new Date()
        const diff = now.getTime() - date.getTime()

        const minutes = Math.floor(diff / (1000 * 60))
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))

        if (minutes < 1) return 'just now'
        if (minutes < 60) return `${minutes}m ago`
        if (hours < 24) return `${hours}h ago`
        if (days < 7) return `${days}d ago`

        return date.toLocaleDateString()
    }

    const handleLike = async () => {
        if (!isSignedIn) {
            showWarning('Please sign in to like comments')
            return
        }

        if (!guideId) {
            showError('Guide ID is missing')
            return
        }

        setIsLikeLoading(true)
        try {
            await commentService.toggleLike('trip', guideId, comment.id)
        } catch (error) {
            showError('Failed to update like', 'Please try again')
        } finally {
            setIsLikeLoading(false)
        }
    }

    const handleReply = () => {
        if (!isSignedIn) {
            showWarning('Please sign in to reply')
            return
        }
        setIsReplying(true)
    }

    const handleReplySubmitted = () => {
        setIsReplying(false)
        onReplySubmitted?.()
    }

    const handleEdit = () => {
        setIsEditing(true)
        setEditContent(comment.content)
    }

    const handleSaveEdit = async () => {
        if (!editContent.trim()) {
            showWarning('Comment cannot be empty')
            return
        }

        if (!guideId) {
            showError('Guide ID is missing')
            return
        }

        setIsUpdateLoading(true)
        try {
            await commentService.updateComment('trip', guideId, comment.id, {
                content: editContent.trim(),
            })
            setIsEditing(false)
            showSuccess('Comment updated successfully')
        } catch (error) {
            showError('Failed to update comment', 'Please try again')
        } finally {
            setIsUpdateLoading(false)
        }
    }

    const handleCancelEdit = () => {
        setIsEditing(false)
        setEditContent(comment.content)
    }

    const handleDelete = async () => {
        if (!guideId) {
            showError('Guide ID is missing')
            return
        }

        try {
            await commentService.deleteComment('trip', guideId, comment.id)
            showSuccess('Comment deleted successfully')
        } catch (error) {
            showError('Failed to delete comment', 'Please try again')
        }
    }

    const visibleReplies = showAllReplies ? comment.replies : comment.replies?.slice(0, 3)

    console.log('CommentItem rendered:', comment)

    return (
        <div className={`${isReply ? 'ml-8 mt-4' : 'border-b border-gray-100 pb-4'}`}>
            <div className="flex items-start gap-3">
                <Avatar className={isReply ? 'h-8 w-8' : 'h-10 w-10'}>
                    <AvatarImage src={comment.user?.photoUrl} />
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                            {comment.user?.name || 'Anonymous User'}
                        </span>
                        <span className="text-sm text-gray-500">
                            {formatDate(new Date(comment.createdAt).getTime())}
                        </span>
                        {comment.isEdited && (
                            <span className="text-xs text-gray-400">(edited)</span>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="space-y-3">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                rows={2}
                                className="resize-none"
                            />
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    disabled={isUpdateLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    disabled={isUpdateLoading || !editContent.trim()}
                                >
                                    {isUpdateLoading ? "Saving..." : "Save"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-gray-800 whitespace-pre-wrap break-words mb-3">
                            {comment.content}
                        </div>
                    )}

                    {!isEditing && (
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleLike}
                                disabled={isLikeLoading}
                                className="flex items-center gap-1 text-gray-500 hover:text-red-500 h-8 px-2"
                            >
                                <Heart className="w-4 h-4" />
                                {comment.reactionsCount || 0}
                            </Button>

                            {!isReply && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleReply}
                                    className="flex items-center gap-1 text-gray-500 h-8 px-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Reply
                                </Button>
                            )}

                            {isOwner && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-500 h-8 w-8 p-0"
                                        >
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={handleEdit}>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                                            <Trash className="w-4 h-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    )}

                    {isReplying && guideId && (
                        <CommentInput
                            guideId={guideId}
                            parentId={comment.id}
                            placeholder="Write a reply..."
                            onCommentSubmitted={handleReplySubmitted}
                            onCancel={() => setIsReplying(false)}
                            isReply={true}
                        />
                    )}

                    {/* Replies */}
                    {!isReply && comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4">
                            {visibleReplies?.map((reply) => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    guideId={guideId}
                                    onReplySubmitted={onReplySubmitted}
                                    isReply={true}
                                />
                            ))}

                            {comment.replies.length > 3 && !showAllReplies && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowAllReplies(true)}
                                    className="mt-2 text-blue-600 h-8"
                                >
                                    Show {comment.replies.length - 3} more replies
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CommentItem