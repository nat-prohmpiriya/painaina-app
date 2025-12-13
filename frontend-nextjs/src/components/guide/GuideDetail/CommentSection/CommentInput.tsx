'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Send, User } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { commentService } from '@/services'
import { useAuth } from '@/hooks/useAuth'
import { useTranslations } from 'next-intl'

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
                <Avatar>
                    <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="flex-1 text-gray-500">
                    {t('auth.signInToLeave')}
                </div>
                <Button>
                    {t('auth.signIn')}
                </Button>
            </div>
        )
    }

    return (
        <div className={`flex items-start gap-3 ${isReply ? 'mt-3 pl-4 border-l-2 border-gray-200' : 'p-4 bg-white rounded-lg border'}`}>
            <Avatar className={isReply ? 'h-8 w-8' : 'h-10 w-10'}>
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-3">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={defaultPlaceholder}
                    rows={isReply ? 2 : 3}
                    onKeyDown={handleKeyPress}
                    className="resize-none"
                />

                <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                        {t('input.hint')}
                    </div>

                    <div className="flex gap-2">
                        {isReply && onCancel && (
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                {t('actions.cancel')}
                            </Button>
                        )}

                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !content.trim()}
                        >
                            {isSubmitting ? (
                                "Posting..."
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    {isReply ? t('actions.reply') : t('actions.comment')}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CommentInput
