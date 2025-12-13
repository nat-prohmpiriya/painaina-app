'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useTrips } from '@/hooks/useTripQueries'
import CreateGuideModal from '../guide/CreateGuideModal'
import GuideCard from '../guide/GuideCard'
import { Spinner } from '@/components/ui/spinner'
import { useTranslations } from 'next-intl'

interface GuideListProps {
    userId: string | string[] | undefined;
    isOwnProfile: boolean;
}

const GuideList = ({ userId, isOwnProfile }: GuideListProps) => {
    const { user, isAuthenticated, isLoading: authLoading } = useAuth()
    const t = useTranslations('profile.guideList')

    // Get userId string
    const userIdStr = Array.isArray(userId) ? userId[0] : userId

    // Use React Query hook - get guides where user is a member
    // For own profile: show all guides (draft + published)
    // For other profiles: show only published guides
    const {
        data: tripsResponse,
        isLoading: loading,
        refetch,
    } = useTrips({
        type: 'guide',
        memberId: userIdStr,
        status: isOwnProfile ? undefined : 'published'
    })

    const guides = tripsResponse?.trips || []

    // Show loading if auth is still loading
    if (authLoading) {
        return (
            <div>
                <div className='w-full flex justify-end'>
                    <CreateGuideModal />
                </div>
                <div className='mt-4 flex justify-center py-8'>
                    <Spinner size="lg" />
                    <p className="ml-2 text-gray-500">{t('loading.auth')}</p>
                </div>
            </div>
        )
    }

    // Show sign in message if not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div>
                <div className='w-full flex justify-end'>
                    <CreateGuideModal />
                </div>
                <div className="text-center py-12">
                    <div className="text-gray-500 mb-4">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">{t('auth.title')}</h3>
                    <p className="text-gray-500">{t('auth.description')}</p>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div>
                <div className='w-full flex justify-end'>
                    <CreateGuideModal />
                </div>
                <div className='mt-4 flex justify-center py-8'>
                    <Spinner size="lg" />
                </div>
            </div>
        )
    }

    return (
        <div>
            {isOwnProfile && (
                <div className='w-full flex justify-end'>
                    <CreateGuideModal />
                </div>
            )}
            <div className='mt-4'>
                {guides && guides.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {guides.map((guide: any) => (
                            <GuideCard key={guide.id} guide={guide} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">{t('empty.title')}</h3>
                        <p className="text-gray-500">{t('empty.description')}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GuideList