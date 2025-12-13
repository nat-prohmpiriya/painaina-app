'use client'

import React, { useState, useEffect } from 'react'
import { Button, Input, Avatar } from 'antd'
import { LuSend, LuUser } from 'react-icons/lu'
import { useUser } from '@clerk/nextjs'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { userService, commentService } from '@/services'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'

const { TextArea } = Input

interface CommentInputProps {
    guideId: string;
    parentId?: string;
    placeholder?: string;
    onCommentSubmitted?: () => void;
    isReply?: boolean;
    onCancel?: () => void;
}

const CommentInput: React.FC<CommentInputProps> = ({
    guideId,
    parentId,
    placeholder,
    onCommentSubmitted,
    isReply = false,
    onCancel
}) => {
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { isSignedIn } = useUser()
    const { showSuccess, showError, showWarning } = useToastMessage()
    const { user } = useAuth()
    const t = useTranslations('guideDetail.comments')

    const defaultPlaceholder = placeholder || t('input.placeholder')

    const handleSubmit = async () => {
        if (!content.trim()) {
            showWarning(t('input.validation'))
            return
        }

        if (!isSignedIn) {
            showError(t('auth.signInToComment'))
            return
        }

        setIsSubmitting(true)
        try {
            await commentService.createComment(guideId, {
                content: content.trim(),
                parentId: parentId,
            })

            setContent('')
            showSuccess(isReply ? t('success.replyPosted') : t('success.commentPosted'))
            onCommentSubmitted?.()
        } catch (error) {
            console.error('Failed to create comment:', error)
            showError(t('error.failedToPost'), 'Please try again')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit()
        }
    }

    if (!isSignedIn) {
        return (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                <Avatar icon={<LuUser />} />
                <div className="flex-1 text-gray-500">
                    {t('auth.signInToLeave')}
                </div>
                <Button type="primary">
                    {t('auth.signIn')}
                </Button>
            </div>
        )
    }

    return (
        <div className={`flex items-start gap-3 ${isReply ? 'mt-3 pl-4 border-l-2 border-gray-200' : 'p-4 bg-white rounded-lg border'}`}>
            <Avatar
                src={user?.photoUrl}
                icon={<LuUser />}
                size={isReply ? 32 : 40}
            />

            <div className="flex-1 space-y-3">
                <TextArea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={defaultPlaceholder}
                    autoSize={{ minRows: isReply ? 2 : 3, maxRows: 8 }}
                    onKeyDown={handleKeyPress}
                    className="border-gray-300 focus:border-blue-500"
                />

                <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                        {t('input.hint')}
                    </div>

                    <div className="flex gap-2">
                        {isReply && onCancel && (
                            <Button
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                {t('actions.cancel')}
                            </Button>
                        )}

                        <Button
                            type="primary"
                            icon={<LuSend className="w-4 h-4" />}
                            onClick={handleSubmit}
                            loading={isSubmitting}
                            disabled={!content.trim()}
                        >
                            {isReply ? t('actions.reply') : t('actions.comment')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CommentInput
