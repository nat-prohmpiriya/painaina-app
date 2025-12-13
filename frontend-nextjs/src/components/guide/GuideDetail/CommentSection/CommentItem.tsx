'use client'

import React, { useState } from 'react'
import { Avatar, Button, Dropdown, Input } from 'antd'
import { LuHeart, LuMessageSquare, LuMenu, LuPencil, LuTrash, LuUser } from 'react-icons/lu'
import { useUser } from '@clerk/nextjs'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { commentService } from '@/services'
import CommentInput from './CommentInput'
import { CommentWithUser } from '@/interfaces/comment.interface'

const { TextArea } = Input

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

    const menuItems = isOwner ? [
        {
            key: 'edit',
            label: 'Edit',
            icon: <LuPencil className="w-4 h-4" />,
            onClick: handleEdit,
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: <LuTrash className="w-4 h-4" />,
            onClick: handleDelete,
            danger: true,
        },
    ] : []

    const visibleReplies = showAllReplies ? comment.replies : comment.replies?.slice(0, 3)

    console.log('CommentItem rendered:', comment)

    return (
        <div className={`${isReply ? 'ml-8 mt-4' : 'border-b border-gray-100 pb-4'}`}>
            <div className="flex items-start gap-3">
                <Avatar
                    src={comment.user?.photoUrl}
                    icon={<LuUser />}
                    size={isReply ? 32 : 40}
                />

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
                            <TextArea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                autoSize={{ minRows: 2, maxRows: 6 }}
                                className="border-gray-300 focus:border-blue-500"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="small"
                                    onClick={handleCancelEdit}
                                    disabled={isUpdateLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={handleSaveEdit}
                                    loading={isUpdateLoading}
                                    disabled={!editContent.trim()}
                                >
                                    Save
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
                                type="text"
                                size="small"
                                icon={<LuHeart className="w-4 h-4" />}
                                onClick={handleLike}
                                loading={isLikeLoading}
                                className="flex items-center gap-1 text-gray-500 hover:text-red-500"
                            >
                                {comment.reactionsCount || 0}
                            </Button>

                            {!isReply && (
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<LuMessageSquare className="w-4 h-4" />}
                                    onClick={handleReply}
                                    className="flex items-center gap-1 text-gray-500"
                                >
                                    Reply
                                </Button>
                            )}

                            {menuItems.length > 0 && (
                                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<LuMenu className="w-4 h-4" />}
                                        className="text-gray-500"
                                    />
                                </Dropdown>
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
                                    type="text"
                                    size="small"
                                    onClick={() => setShowAllReplies(true)}
                                    className="mt-2 text-blue-600"
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