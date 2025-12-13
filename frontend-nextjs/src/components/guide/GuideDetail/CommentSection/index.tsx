'use client'

import React, { useState, useEffect } from 'react'
import { Button, Spin, Empty } from 'antd'
import { LuMessageSquare, LuRefreshCw } from 'react-icons/lu'
import { commentService } from '@/services'
import CommentInput from './CommentInput'
import CommentItem from './CommentItem'
import { useTranslations } from 'next-intl'

interface CommentSectionProps {
    guideId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ guideId }) => {
    const [refreshKey, setRefreshKey] = useState(0)
    const [comments, setComments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const t = useTranslations('guideDetail.comments')

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
                const commentsData = await commentService.getCommentsByGuideId(guideId)
                setComments(commentsData)

            } catch (error) {
                console.error('Failed to fetch comments:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [guideId, refreshKey])

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1)
    }

    const handleCommentSubmitted = () => {
        // Trigger re-fetch by updating refresh key
        setRefreshKey(prev => prev + 1)
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="border-b border-gray-200 pb-4">
                    <div className="flex items-center gap-2">
                        <LuMessageSquare className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">{t('title')}</h3>
                        <Spin size="small" />
                    </div>
                </div>

                <div className="flex justify-center py-8">
                    <Spin size="large" />
                </div>
            </div>
        )
    }

    return (
        <div className="px-6 space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <LuMessageSquare className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">{t('title')}</h3>
                        <span className="text-sm text-gray-500">
                            ({comments.length})
                        </span>
                    </div>
                </div>
            </div>

            {/* Comment Input */}
            <CommentInput
                guideId={guideId}
                onCommentSubmitted={handleCommentSubmitted}
            />

            {/* Comments List */}
            {comments && comments.length > 0 ? (
                <div className="space-y-6">
                    {comments.map((comment: any) => (
                        <CommentItem
                            key={`${comment.id}-${refreshKey}`}
                            comment={comment}
                            guideId={guideId}
                            onReplySubmitted={handleCommentSubmitted}
                        />
                    ))}
                </div>
            ) : (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span className="text-gray-500">
                            {t('empty')}
                        </span>
                    }
                    className="py-8"
                />
            )}

            {/* Load More Button (for future pagination) */}
            {comments && comments.length >= 20 && (
                <div className="flex justify-center pt-4">
                    <Button type="default">
                        {t('loadMore')}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default CommentSection